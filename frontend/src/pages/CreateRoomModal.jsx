import { useState } from "react";
import axios from "axios";
import "../style/createroom.css";

export default function CreateRoomModal({ onClose, onRoomCreated }) {
  const [form, setForm] = useState({ name: "", description: "", type: "" });
  const [error, setError] = useState("");

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/rooms`,
        form,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onRoomCreated && onRoomCreated(res.data.room);
      onClose();
    } catch (err) {
      setError("Erreur lors de la création de la salle");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Créer une salle</h3>
        {error && <div className="modal-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Nom de la salle"
            value={form.name}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="description"
            placeholder="Description"
            value={form.description}
            onChange={handleChange}
          />
          <select
            name="type"
            value={form.type}
            onChange={handleChange}
            required
          >
            <option value="">Type</option>
            <option value="Rencontres">Rencontres</option>
            <option value="Amitié">Amitié</option>
            <option value="Mariage">Mariage</option>
            <option value="Autre">Autre</option>
          </select>
          <button type="submit">Créer</button>
          <button type="button" onClick={onClose}>Annuler</button>
        </form>
      </div>
    </div>
  );
}
