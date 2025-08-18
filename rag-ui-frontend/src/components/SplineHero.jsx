import React from 'react';

const SplineHero = ({ sceneUrl }) => {
  return (
    <div className="spline-hero">
      {sceneUrl ? (
        <spline-viewer loading="eager" url={sceneUrl} style={{ width: '100%', height: '100%' }} />
      ) : (
        <div className="spline-fallback">3D experience will appear here.</div>
      )}
    </div>
  );
};

export default SplineHero;
