from fastapi import FastAPI, Request, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from typing import Any
import platform
import shutil
from PIL import Image
import pytesseract
import io
from dotenv import load_dotenv

from langchain.schema import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain import hub
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser

load_dotenv()

# Default API key fallback (user-provided). Prefer setting GOOGLE_API_KEY in .env.
DEFAULT_GOOGLE_API_KEY = "AIzaSyACjxCx0Eizrnc9WVVKpOrqIQEBrBUAONw"

# --- Tesseract detection and setup ---
TESSERACT_AVAILABLE = True
TESSERACT_PATH = None

def setup_tesseract():
	"""Setup Tesseract OCR with comprehensive path detection"""
	global TESSERACT_AVAILABLE, TESSERACT_PATH
	
	# Check environment variable first
	tesseract_env_path = os.environ.get("TESSERACT_PATH")
	if tesseract_env_path:
		tesseract_env_path = tesseract_env_path.strip().strip('"').strip("'")
		if os.path.exists(tesseract_env_path):
			pytesseract.pytesseract.tesseract_cmd = tesseract_env_path
			TESSERACT_PATH = tesseract_env_path
			print(f"✅ Using Tesseract from environment: {tesseract_env_path}")
			return True
	
	# Check if tesseract is in PATH
	if shutil.which("tesseract") is not None:
		TESSERACT_PATH = shutil.which("tesseract")
		print(f"✅ Found Tesseract in PATH: {TESSERACT_PATH}")
		return True
	
	# Check Windows default locations
	if platform.system() == "Windows":
		possible_paths = [
			r"C:\Program Files\Tesseract-OCR\tesseract.exe",
			r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
			r"C:\Users\{}\AppData\Local\Programs\Tesseract-OCR\tesseract.exe".format(os.getenv('USERNAME', '')),
		]
		
		for path in possible_paths:
			if os.path.exists(path):
				pytesseract.pytesseract.tesseract_cmd = path
				TESSERACT_PATH = path
				print(f"✅ Found Tesseract at: {path}")
				return True
		
		# If not found, set to False
		TESSERACT_AVAILABLE = False
		TESSERACT_PATH = None
		print("❌ Tesseract not found in common Windows locations")
		print("   Please install from: https://github.com/UB-Mannheim/tesseract/wiki")
		return False
	
	# For other operating systems
	TESSERACT_AVAILABLE = False
	TESSERACT_PATH = None
	print("❌ Tesseract not found. Please install Tesseract OCR on your system.")
	return False

# Setup Tesseract on import
setup_tesseract()

# Helper to validate tesseract is callable at runtime
def _tesseract_ready() -> tuple[bool, str | None]:
	"""Check if Tesseract is ready and working"""
	if not TESSERACT_AVAILABLE:
		return False, "Tesseract not available. Please install Tesseract OCR."
	
	if not TESSERACT_PATH:
		return False, "Tesseract path not set. Please check installation."
	
	try:
		version = pytesseract.get_tesseract_version()
		return True, f"Tesseract {version} ready at {TESSERACT_PATH}"
	except Exception as e:
		return False, f"Tesseract error: {str(e)}. Path: {TESSERACT_PATH}"

# --- Data Preparation (move to startup) ---
texts = [
	""" Patient Name: Mr. Dummy

	‘Age/Sex: 23 YRS/M

	Referred By: _Dr. Self Date: 14/05/2021 TIN
	Reg. no. 1024 UHID: 1028
	Collected on: 14/05/2021 Reported on: 14/05/2021 03:03 PM
	HAEMATOLOGY
	COMPLETE BLOOD COUNT (CBC)
	TEST VALUE UNIT REFERENCE
	Hemoglobin 14 g/dl 13-17
	Total Leukocyte Count H 12,000 cumm 4,000 - 11,000
	Differential Leucocyte Count
	Neutrophils 45 % 40-80
	Lymphocyte H 45 % 20-40
	Eosinophils 05 % 1-6
	Monocytes 05 % 2-10
	Basophils 00 % <2
	Platelet Count 40 lakhs/cumm 15-45
	Total RBC Count 51 million/cumm 45-55
	Hematocrit Value, Het H 56 % 40-50
	Mean Corpuscular Volume, MCV H 109.8 fL 83-101
	Mean Cell Haemoglobin, MCH 275 Pg 27-32
	Mean Cell Haemoglobin CON,MCHC L 25.0 % 315-345

	"""
]

documents = [Document(page_content=text) for text in texts]

text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
split_texts = text_splitter.split_documents(documents)

embedding_model = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
vectorstore = Chroma.from_documents(documents=split_texts, embedding=embedding_model)
retriever = vectorstore.as_retriever()
prompt = hub.pull("rlm/rag-prompt")

def format_docs(docs):
	context_text = "\n".join(doc.page_content for doc in docs)
	prompt_context = f"""
	You are a helpful medical assistant. Here is the patient's blood test report:

	{context_text}

	Answer the user's question based  on this report. Explain any medical terms simply as like a normal people language.
	If user ask outside the report but related to report then search it and answer it

	"""
	return prompt_context

# LLM factory that reads the API key at request time
def get_llm():
	# Use env var if set; otherwise fall back to the provided default key
	api_key = os.environ.get("GOOGLE_API_KEY") or DEFAULT_GOOGLE_API_KEY
	if not api_key:
		return None
	return ChatGoogleGenerativeAI(model="models/gemini-2.5-pro", api_key=api_key)

# --- FastAPI App ---
app = FastAPI()

# CORS: allow all during development to avoid origin mismatches
app.add_middleware(
	CORSMiddleware,
	allow_origins=["*"],
	allow_credentials=False,
	allow_methods=["*"],
	allow_headers=["*"],
)

class AskRequest(BaseModel):
	question: str
	context: str = None

class AskResponse(BaseModel):
	answer: str
	error: str = None

@app.post("/upload_report")
async def upload_report(file: UploadFile = File(...)):
	"""Upload and extract text from medical report images"""
	
	# Validate file type
	if not file.content_type or not file.content_type.startswith('image/'):
		return {"error": f"Invalid file type: {file.content_type}. Please upload an image file (PNG, JPEG, etc.)"}
	
	# Check Tesseract availability
	ready, status = _tesseract_ready()
	if not ready:
		return {
			"error": f"Tesseract OCR not available: {status}",
			"details": {
				"tesseract_available": TESSERACT_AVAILABLE,
				"tesseract_path": TESSERACT_PATH,
				"platform": platform.system(),
				"installation_help": "Download from: https://github.com/UB-Mannheim/tesseract/wiki"
			}
		}
	
	try:
		# Read and process the image
		contents = await file.read()
		image = Image.open(io.BytesIO(contents))
		
		# Convert to RGB if necessary (Tesseract works better with RGB)
		if image.mode != 'RGB':
			image = image.convert('RGB')
		
		# Extract text using Tesseract
		text = pytesseract.image_to_string(image)
		
		# Check if text was extracted
		if not text or text.strip() == "":
			return {
				"error": "No text could be extracted from the image",
				"details": {
					"image_size": image.size,
					"image_mode": image.mode,
					"tesseract_path": TESSERACT_PATH,
					"suggestions": [
						"Make sure the image is clear and readable",
						"Try with a higher resolution image",
						"Ensure good contrast between text and background"
					]
				}
			}
		
		# Return successful extraction
		return {
			"text": text,
			"details": {
				"image_size": image.size,
				"image_mode": image.mode,
				"text_length": len(text),
				"tesseract_path": TESSERACT_PATH
			}
		}
		
	except Exception as e:
		# Return detailed error information
		return {
			"error": f"OCR processing failed: {str(e)}",
			"details": {
				"exception_type": type(e).__name__,
				"tesseract_path": TESSERACT_PATH,
				"file_info": {
					"filename": file.filename,
					"content_type": file.content_type,
					"size": len(contents) if 'contents' in locals() else "unknown"
				}
			}
		}

@app.post("/ask", response_model=AskResponse)
async def ask(request: AskRequest):
	try:
		llm = get_llm()
		if llm is None:
			return AskResponse(answer="", error="Missing GOOGLE_API_KEY. Set it in MediScanAI/.env or as an environment variable, then restart the server.")

		# If context is provided, use it as the document for RAG
		if request.context:
			user_documents = [Document(page_content=request.context)]
			user_split_texts = text_splitter.split_documents(user_documents)
			user_vectorstore = Chroma.from_documents(documents=user_split_texts, embedding=embedding_model)
			user_retriever = user_vectorstore.as_retriever()
			user_rag_chain = (
				{"context": user_retriever | format_docs, "question": RunnablePassthrough()}
				| prompt
				| llm
				| StrOutputParser()
			)
			answer = user_rag_chain.invoke(request.question)
		else:
			base_chain = (
				{"context": retriever | format_docs, "question": RunnablePassthrough()}
				| prompt
				| llm
				| StrOutputParser()
			)
			answer = base_chain.invoke(request.question)
		return AskResponse(answer=answer)
	except Exception as e:
		return AskResponse(answer="", error=str(e))

@app.get("/")
def root():
	return {"message": "RAG Medical Assistant API is running."}

@app.get("/tesseract-status")
def tesseract_status():
	"""Get detailed Tesseract OCR status and configuration"""
	ready, status = _tesseract_ready()
	return {
		"tesseract_available": TESSERACT_AVAILABLE,
		"tesseract_path": TESSERACT_PATH,
		"tesseract_ready": ready,
		"status_message": status,
		"platform": platform.system(),
		"python_version": platform.python_version(),
		"installation_help": "Download from: https://github.com/UB-Mannheim/tesseract/wiki" if platform.system() == "Windows" else "Install Tesseract OCR for your system"
	}

@app.get("/test-ocr")
def test_ocr():
	"""Test OCR functionality with a sample image if available"""
	ready, status = _tesseract_ready()
	if not ready:
		return {"error": f"Tesseract not ready: {status}"}
	
	# Check if we have a test image
	test_image_path = "image.png"
	if not os.path.exists(test_image_path):
		return {"error": "No test image found. Please place an 'image.png' file in the project directory."}
	
	try:
		image = Image.open(test_image_path)
		text = pytesseract.image_to_string(image)
		
		return {
			"success": True,
			"test_image": test_image_path,
			"image_size": image.size,
			"image_mode": image.mode,
			"extracted_text": text[:500] + "..." if len(text) > 500 else text,
			"text_length": len(text),
			"tesseract_path": TESSERACT_PATH
		}
	except Exception as e:
		return {
			"error": f"OCR test failed: {str(e)}",
			"test_image": test_image_path,
			"exception_type": type(e).__name__,
			"tesseract_path": TESSERACT_PATH
		}
