import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "../style/login.css";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/login`,
        form
      );
      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
        navigate("/chatroom");
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
        (err.response?.data?.errors && err.response.data.errors[0]?.msg) ||
        "Erreur lors de la connexion"
      );
    }
    setLoading(false);
  };

  return (
    <div className="login-container">
      <form className="login-card" onSubmit={handleSubmit}>
        <h2 className="login-title">Connexion</h2>
        {error && <div className="login-error">{error}</div>}
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
        <button type="submit" className="login-btn" disabled={loading}>
          {loading ? "Connexion..." : "Se connecter"}
        </button>
        <div className="login-link">
          Pas encore de compte ? <Link to="/register">Créer un compte</Link>
        </div>
      </form>
    </div>
  );
}
