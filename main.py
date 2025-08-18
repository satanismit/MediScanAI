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

from langchain.schema import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain import hub
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser

# --- Tesseract detection ---
TESSERACT_AVAILABLE = True
if shutil.which("tesseract") is None:
    if platform.system() == "Windows":
        default_path = r"C:\\Program Files\\Tesseract-OCR\\tesseract.exe"
        if os.path.exists(default_path):
            pytesseract.pytesseract.tesseract_cmd = default_path
        else:
            TESSERACT_AVAILABLE = False
    else:
        TESSERACT_AVAILABLE = False

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

# Load Google API key directly (user provided)
GOOGLE_API_KEY = "AIzaSyACjxCx0Eizrnc9WVVKpOrqIQEBrBUAONw"

llm = ChatGoogleGenerativeAI(model="models/gemini-2.5-pro", google_api_key=GOOGLE_API_KEY)

rag_chain = (
    { 'context': retriever | format_docs, 'question': RunnablePassthrough() }
    | prompt
    | llm
    | StrOutputParser()
)

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
    if not TESSERACT_AVAILABLE:
        return {"error": "Tesseract OCR is not installed. Install Tesseract (Windows: C\\Program Files\\Tesseract-OCR) and restart the server."}
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        text = pytesseract.image_to_string(image)
        return {"text": text}
    except Exception as e:
        # Return error with context
        return {"error": f"OCR failed: {str(e)}"}

@app.post("/ask", response_model=AskResponse)
async def ask(request: AskRequest):
    try:
        # If context is provided, use it as the document for RAG
        if request.context:
            user_documents = [Document(page_content=request.context)]
            user_split_texts = text_splitter.split_documents(user_documents)
            user_vectorstore = Chroma.from_documents(documents=user_split_texts, embedding=embedding_model)
            user_retriever = user_vectorstore.as_retriever()
            user_rag_chain = (
                { 'context': user_retriever | format_docs, 'question': RunnablePassthrough() }
                | prompt
                | llm
                | StrOutputParser()
            )
            answer = user_rag_chain.invoke(request.question)
        else:
            answer = rag_chain.invoke(request.question)
        return AskResponse(answer=answer)
    except Exception as e:
        return AskResponse(answer="", error=str(e))

@app.get("/")
def root():
    return {"message": "RAG Medical Assistant API is running."} 