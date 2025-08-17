import { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import "../style/chatmedia.css";

export default function ChatMedia() {
  const { roomId } = useParams();
  const [files, setFiles] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    axios.get(`${import.meta.env.VITE_API_URL}/files/room/${roomId}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setFiles(res.data.files));
  }, [roomId]);

  return (
    <div className="chatmedia-container">
      <h2>Fichiers partagés</h2>
      <ul>
        {files.map(file => (
          <li key={file.id}>
            <a
              href={`${import.meta.env.VITE_API_URL.replace("/api", "")}/uploads/${file.filePath}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {file.fileName}
            </a>
            <span> ({file.fileType})</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
