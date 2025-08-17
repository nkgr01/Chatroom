import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "../style/register.css";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    age: "",
    gender: "",
    interests: "",
    intentions: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [avatar, setAvatar] = useState(null);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => formData.append(key, value));
      if (avatar) formData.append("avatar", avatar);

      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/register`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
        navigate("/login");
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
        (err.response?.data?.errors && err.response.data.errors[0]?.msg) ||
        "Erreur lors de l'inscription"
      );
    }
    setLoading(false);
  };

  return (
    <div className="register-container">
      <form className="register-card" onSubmit={handleSubmit}>
        <h2 className="register-title">Créer un compte</h2>
        {error && <div className="register-error">{error}</div>}
        <input
          type="text"
          name="username"
          placeholder="Pseudo"
          value={form.username}
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Adresse email"
          value={form.email}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Mot de passe"
          value={form.password}
          onChange={handleChange}
          required
        />
        <input
          type="number"
          name="age"
          placeholder="Âge"
          value={form.age}
          onChange={handleChange}
          required
        />
        <select
          name="gender"
          value={form.gender}
          onChange={handleChange}
          required
        >
          <option value="">Genre</option>
          <option value="Homme">Homme</option>
          <option value="Femme">Femme</option>
          <option value="Autre">Autre</option>
        </select>
        <input
          type="text"
          name="interests"
          placeholder="Centres d'intérêt"
          value={form.interests}
          onChange={handleChange}
        />
        <select
          name="intentions"
          value={form.intentions}
          onChange={handleChange}
          required
        >
          <option value="">Intentions</option>
          <option value="Rencontres">Rencontres</option>
          <option value="Amitié">Amitié</option>
          <option value="Mariage">Mariage</option>
          <option value="Autre">Autre</option>
        </select>
        <input
          type="file"
          accept="image/*"
          onChange={e => setAvatar(e.target.files[0])}
        />
        <button type="submit" className="register-btn" disabled={loading}>
          {loading ? "Création..." : "S'inscrire"}
        </button>
        <div className="register-link">
          Déjà un compte ? <Link to="/login">Se connecter</Link>
        </div>
      </form>
    </div>
  );
}
