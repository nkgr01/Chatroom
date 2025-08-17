import { useEffect, useState } from "react";
import axios from "axios";
import "../style/editprofile.css";
import { useNavigate } from "react-router-dom";

export default function EditProfile() {
  const [form, setForm] = useState({
    username: "",
    age: "",
    gender: "",
    interests: "",
    intentions: "",
    password: ""
  });
  const [avatar, setAvatar] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    axios.get(`${import.meta.env.VITE_API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      setForm({
        username: res.data.user.username,
        age: res.data.user.age,
        gender: res.data.user.gender,
        interests: res.data.user.interests,
        intentions: res.data.user.intentions,
      });
    });
  }, []);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError("");
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (key !== "password" || value) formData.append(key, value);
      });
      if (avatar) formData.append("avatar", avatar);

      await axios.patch(
        `${import.meta.env.VITE_API_URL}/users/profile`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigate("/chatroom");
    } catch (err) {
      setError("Erreur lors de la modification du profil");
    }
  };

  return (
    <div className="editprofile-container">
      <form className="editprofile-form" onSubmit={handleSubmit}>
        <h2>Modifier mon profil</h2>
        {error && <div className="editprofile-error">{error}</div>}
        <input
          type="text"
          name="username"
          placeholder="Pseudo"
          value={form.username}
          onChange={handleChange}
          required
        />
        <input
          type="number"
          name="age"
          placeholder="Âge"
          value={form.age}
          onChange={handleChange}
        />
        <select
          name="gender"
          value={form.gender}
          onChange={handleChange}
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
        >
          <option value="">Intentions</option>
          <option value="Rencontres">Rencontres</option>
          <option value="Amitié">Amitié</option>
          <option value="Mariage">Mariage</option>
          <option value="Autre">Autre</option>
        </select>
        <input
          type="password"
          name="password"
          placeholder="Nouveau mot de passe (laisser vide pour ne pas changer)"
          value={form.password}
          onChange={handleChange}
        />
        <input
          type="file"
          accept="image/*"
          onChange={e => setAvatar(e.target.files[0])}
        />
        <button type="submit">Enregistrer</button>
      </form>
    </div>
  );
}
