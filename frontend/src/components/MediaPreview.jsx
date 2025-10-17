import React, { useState } from 'react';
import '../style/mediaPreview.css';

const MediaPreview = ({ file, inMessage = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const fileUrl = `${import.meta.env.VITE_API_URL.replace("/api", "")}/uploads/${file.filePath}`;

  const handlePreviewClick = () => {
    setIsExpanded(!isExpanded);
  };

  const renderMedia = () => {
    const size = inMessage ? 'message' : 'thumbnail';
    
    if (file.mimeType?.startsWith('image/')) {
      return (
        <div className={`media-preview ${size}`}>
          <img 
            src={fileUrl} 
            alt={file.originalName}
            onClick={handlePreviewClick}
            className={isExpanded ? 'expanded' : ''}
          />
        </div>
      );
    } else if (file.mimeType?.startsWith('video/')) {
      return (
        <div className={`media-preview ${size}`}>
          <video 
            controls
            className={isExpanded ? 'expanded' : ''}
            onClick={(e) => e.target.paused ? e.target.play() : e.target.pause()}
          >
            <source src={fileUrl} type={file.mimeType} />
            Votre navigateur ne supporte pas la lecture de vidéos.
          </video>
        </div>
      );
    } else if (file.mimeType?.startsWith('audio/')) {
      return (
        <div className={`media-preview audio ${size}`}>
          <audio controls>
            <source src={fileUrl} type={file.mimeType} />
            Votre navigateur ne supporte pas la lecture audio.
          </audio>
          <div className="audio-info">
            <span>🎵 {file.originalName}</span>
          </div>
        </div>
      );
    } else {
      return (
        <div className={`media-preview document ${size}`}>
          <div className="document-icon">📄</div>
          <div className="document-info">
            <span>{file.originalName}</span>
            <small>{(file.fileSize / 1024).toFixed(0)} Ko</small>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="media-container">
      {renderMedia()}
      {isExpanded && (
        <div className="media-overlay" onClick={() => setIsExpanded(false)}>
          <div className="media-modal">
            {file.mimeType?.startsWith('image/') && (
              <img src={fileUrl} alt={file.originalName} />
            )}
            {file.mimeType?.startsWith('video/') && (
              <video controls>
                <source src={fileUrl} type={file.mimeType} />
              </video>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaPreview;