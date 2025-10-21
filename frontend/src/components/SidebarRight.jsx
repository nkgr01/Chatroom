import React, { useState, useMemo } from 'react';
import MediaPreview from './MediaPreview';
import '../style/sidebarRight.css';

const SidebarRight = ({ sharedFiles, linkPreviews, messages }) => {
  const [activeTab, setActiveTab] = useState('all');

  // Extraire les liens de tous les messages
  const extractedLinks = useMemo(() => {
    if (!messages) return [];
    
    const links = [];
    messages.forEach(msg => {
      if (msg.linkPreviews && msg.linkPreviews.length > 0) {
        msg.linkPreviews.forEach(preview => {
          links.push({
            ...preview,
            messageId: msg.id,
            createdAt: msg.createdAt,
            sender: msg.sender
          });
        });
      }
    });
    return links;
  }, [messages]);

  // Catégoriser les fichiers
  const categorizedFiles = useMemo(() => {
    const categories = {
      images: [],
      videos: [],
      audio: [],
      documents: [],
      all: sharedFiles || []
    };

    if (sharedFiles) {
      sharedFiles.forEach(file => {
        if (file.mimeType?.startsWith('image/')) {
          categories.images.push(file);
        } else if (file.mimeType?.startsWith('video/')) {
          categories.videos.push(file);
        } else if (file.mimeType?.startsWith('audio/')) {
          categories.audio.push(file);
        } else {
          categories.documents.push(file);
        }
      });
    }

    return categories;
  }, [sharedFiles]);

  const tabs = [
    { id: 'all', label: 'Tout', count: categorizedFiles.all.length },
    { id: 'images', label: 'Images', icon: '🖼️', count: categorizedFiles.images.length },
    { id: 'videos', label: 'Vidéos', icon: '🎥', count: categorizedFiles.videos.length },
    { id: 'audio', label: 'Audio', icon: '🎵', count: categorizedFiles.audio.length },
    { id: 'documents', label: 'Documents', icon: '📄', count: categorizedFiles.documents.length },
    { id: 'links', label: 'Liens', icon: '🔗', count: extractedLinks.length }
  ];

  const renderContent = () => {
    if (activeTab === 'links') {
      return (
        <div className="links-list">
          {extractedLinks.length > 0 ? (
            extractedLinks.map((link, idx) => (
              <div key={idx} className="link-item" onClick={() => window.open(link.url, '_blank')}>
                <div className="link-item-content">
                  {link.image && (
                    <img src={link.image} alt={link.title} className="link-thumbnail" onError={(e) => e.target.style.display = 'none'} />
                  )}
                  <div className="link-info">
                    <div className="link-title">{link.title}</div>
                    <div className="link-site">{link.siteName}</div>
                    <div className="link-sender">
                      Partagé par {link.sender?.username}
                    </div>
                  </div>
                </div>
                <div className="link-icon-action">🔗</div>
              </div>
            ))
          ) : (
            <div className="no-items">
              <div className="no-items-icon">🔗</div>
              <p>Aucun lien partagé</p>
            </div>
          )}
        </div>
      );
    }

    const files = activeTab === 'all' ? categorizedFiles.all : categorizedFiles[activeTab];

    return (
      <div className="files-grid">
        {files && files.length > 0 ? (
          files.map(file => (
            <div key={file.id} className="file-grid-item">
              <MediaPreview file={file} />
              <div className="file-item-info">
                <div className="file-name">{file.originalName}</div>
                <div className="file-actions">
                  <a
                    href={`${import.meta.env.VITE_API_URL.replace("/api", "")}/uploads/${file.filePath}`}
                    download
                    className="file-download-btn"
                    title="Télécharger"
                  >
                    ⬇️
                  </a>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="no-items">
            <div className="no-items-icon">📁</div>
            <p>Aucun fichier</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="sidebar-right">
      <div className="sidebar-header">
        <h3 className="sidebar-title">Médias et Fichiers</h3>
        <p className="sidebar-subtitle">
          {categorizedFiles.all.length} fichier{categorizedFiles.all.length !== 1 ? 's' : ''} • {extractedLinks.length} lien{extractedLinks.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="sidebar-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon && <span className="tab-icon">{tab.icon}</span>}
            <span className="tab-label">{tab.label}</span>
            {tab.count > 0 && <span className="tab-count">{tab.count}</span>}
          </button>
        ))}
      </div>

      <div className="sidebar-content">
        {renderContent()}
      </div>
    </div>
  );
};

export default SidebarRight;
