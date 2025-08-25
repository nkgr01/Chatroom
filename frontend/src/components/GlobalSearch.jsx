import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../style/globalSearch.css';

const GlobalSearch = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ messages: [], users: [], rooms: [] });
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  // Fermer la recherche en cliquant à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  // Focus sur l'input quand la recherche s'ouvre
  useEffect(() => {
    if (isOpen) {
      const input = document.getElementById('search-input');
      if (input) {
        input.focus();
      }
    }
  }, [isOpen]);

  // Recherche avec debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim().length >= 2) {
        performSearch();
      } else if (query.trim().length >= 1) {
        getSuggestions();
      } else {
        setResults({ messages: [], users: [], rooms: [] });
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const performSearch = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/search/global`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { query: query.trim(), type: activeTab }
      });

      setResults(response.data.results);
      setShowSuggestions(false);
    } catch (error) {
  // ...log supprimé pour la production...
    } finally {
      setLoading(false);
    }
  };

  const getSuggestions = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/search/suggestions`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { query: query.trim() }
      });

      setSuggestions(response.data.suggestions);
      setShowSuggestions(true);
    } catch (error) {
  // ...log supprimé pour la production...
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion.text);
    setShowSuggestions(false);
    
    if (suggestion.type === 'user') {
      navigate(`/profile/${suggestion.id}`);
    } else if (suggestion.type === 'room') {
      navigate(`/chatroom/${suggestion.id}`);
    }
    onClose();
  };

  const handleResultClick = (result, type) => {
    if (type === 'message') {
      if (result.type === 'room') {
        navigate(`/chatroom/${result.roomId}`);
      } else {
        navigate(`/private/${result.senderId === result.sender.id ? result.receiverId : result.senderId}`);
      }
    } else if (type === 'user') {
      navigate(`/profile/${result.id}`);
    } else if (type === 'room') {
      navigate(`/chatroom/${result.id}`);
    }
    onClose();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'À l\'instant';
    } else if (diffInHours < 24) {
      return `Il y a ${Math.floor(diffInHours)}h`;
    } else if (diffInHours < 48) {
      return 'Hier';
    } else {
      return date.toLocaleDateString('fr-FR');
    }
  };

  const highlightText = (text, query) => {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  };

  const getTotalResults = () => {
    return results.messages.length + results.users.length + results.rooms.length;
  };

  if (!isOpen) return null;

  return (
    <div className="search-overlay">
      <div className="search-modal" ref={searchRef}>
        {/* Header */}
        <div className="search-header">
          <div className="search-input-container">
            <span className="search-icon">🔍</span>
            <input
              id="search-input"
              type="text"
              placeholder="Rechercher des messages, utilisateurs, salles..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="search-input"
            />
            {loading && <div className="loading-spinner"></div>}
            <button className="close-btn" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="suggestions-container">
            <h4>Suggestions</h4>
            <div className="suggestions-list">
              {suggestions.map((suggestion, index) => (
                <div
                  key={`${suggestion.type}-${suggestion.id}`}
                  className="suggestion-item"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <div className="suggestion-icon">
                    {suggestion.type === 'user' ? '👤' : '💬'}
                  </div>
                  <div className="suggestion-text">
                    <span dangerouslySetInnerHTML={{ 
                      __html: highlightText(suggestion.text, query) 
                    }} />
                    <small>{suggestion.type === 'user' ? 'Utilisateur' : 'Salle'}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Résultats */}
        {query.trim().length >= 2 && !showSuggestions && (
          <div className="search-results">
            {/* Tabs */}
            <div className="search-tabs">
              <button
                className={`tab ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                Tout ({getTotalResults()})
              </button>
              <button
                className={`tab ${activeTab === 'messages' ? 'active' : ''}`}
                onClick={() => setActiveTab('messages')}
              >
                Messages ({results.messages.length})
              </button>
              <button
                className={`tab ${activeTab === 'users' ? 'active' : ''}`}
                onClick={() => setActiveTab('users')}
              >
                Utilisateurs ({results.users.length})
              </button>
              <button
                className={`tab ${activeTab === 'rooms' ? 'active' : ''}`}
                onClick={() => setActiveTab('rooms')}
              >
                Salles ({results.rooms.length})
              </button>
            </div>

            {/* Contenu des résultats */}
            <div className="results-content">
              {/* Messages */}
              {(activeTab === 'all' || activeTab === 'messages') && results.messages.length > 0 && (
                <div className="results-section">
                  <h4>Messages</h4>
                  <div className="messages-list">
                    {results.messages.map((message) => (
                      <div
                        key={message.id}
                        className="message-result"
                        onClick={() => handleResultClick(message, 'message')}
                      >
                        <div className="message-avatar">
                          <img
                            src={
                              message.sender.avatar && !message.sender.avatar.startsWith("http")
                                ? `${import.meta.env.VITE_API_URL.replace("/api", "")}/uploads/${message.sender.avatar}`
                                : message.sender.avatar || "/default-avatar.png"
                            }
                            alt="avatar"
                          />
                        </div>
                        <div className="message-content">
                          <div className="message-header">
                            <span className="sender-name">{message.sender.username}</span>
                            <span className="message-time">{formatDate(message.createdAt)}</span>
                          </div>
                          <div className="message-context">
                            Dans {message.context}
                          </div>
                          <div 
                            className="message-text"
                            dangerouslySetInnerHTML={{ 
                              __html: highlightText(message.content, query) 
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Utilisateurs */}
              {(activeTab === 'all' || activeTab === 'users') && results.users.length > 0 && (
                <div className="results-section">
                  <h4>Utilisateurs</h4>
                  <div className="users-list">
                    {results.users.map((user) => (
                      <div
                        key={user.id}
                        className="user-result"
                        onClick={() => handleResultClick(user, 'user')}
                      >
                        <div className="user-avatar">
                          <img
                            src={
                              user.avatar && !user.avatar.startsWith("http")
                                ? `${import.meta.env.VITE_API_URL.replace("/api", "")}/uploads/${user.avatar}`
                                : user.avatar || "/default-avatar.png"
                            }
                            alt="avatar"
                          />
                          <span className={`online-indicator ${user.isOnline ? 'online' : 'offline'}`}></span>
                        </div>
                        <div className="user-info">
                          <div className="user-name">
                            <span dangerouslySetInnerHTML={{ 
                              __html: highlightText(user.username, query) 
                            }} />
                          </div>
                          <div className="user-details">
                            {user.age} ans • {user.gender} • {user.interests}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Salles */}
              {(activeTab === 'all' || activeTab === 'rooms') && results.rooms.length > 0 && (
                <div className="results-section">
                  <h4>Salles</h4>
                  <div className="rooms-list">
                    {results.rooms.map((room) => (
                      <div
                        key={room.id}
                        className="room-result"
                        onClick={() => handleResultClick(room, 'room')}
                      >
                        <div className="room-icon">
                          {room.icon || '💬'}
                        </div>
                        <div className="room-info">
                          <div className="room-name">
                            <span dangerouslySetInnerHTML={{ 
                              __html: highlightText(room.name, query) 
                            }} />
                          </div>
                          <div className="room-details">
                            {room.userCount} membres • {room.messageCount} messages
                          </div>
                          {room.description && (
                            <div className="room-description">
                              {room.description}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Aucun résultat */}
              {getTotalResults() === 0 && !loading && (
                <div className="no-results">
                  <div className="no-results-icon">🔍</div>
                  <h4>Aucun résultat trouvé</h4>
                  <p>Essayez avec d'autres mots-clés</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Raccourcis clavier */}
        <div className="search-shortcuts">
          <div className="shortcut">
            <kbd>↵</kbd> <span>Ouvrir le premier résultat</span>
          </div>
          <div className="shortcut">
            <kbd>Esc</kbd> <span>Fermer</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalSearch;

