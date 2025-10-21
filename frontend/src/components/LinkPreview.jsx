import React from 'react';
import '../style/linkPreview.css';

const LinkPreview = ({ preview }) => {
  if (!preview || !preview.url) return null;

  const handleClick = (e) => {
    e.preventDefault();
    window.open(preview.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="link-preview" onClick={handleClick}>
      {preview.image && (
        <div className="link-preview-image">
          <img src={preview.image} alt={preview.title} onError={(e) => e.target.style.display = 'none'} />
        </div>
      )}
      <div className="link-preview-content">
        <div className="link-preview-title">{preview.title}</div>
        {preview.description && (
          <div className="link-preview-description">{preview.description}</div>
        )}
        <div className="link-preview-site">
          <span className="link-icon">🔗</span>
          <span className="link-site-name">{preview.siteName}</span>
        </div>
      </div>
    </div>
  );
};

export default LinkPreview;
