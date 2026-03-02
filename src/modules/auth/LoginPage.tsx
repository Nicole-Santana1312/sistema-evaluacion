import { useState } from "react";
import type { CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { FaEnvelope, FaLock } from "react-icons/fa";
import { supabase } from "../../lib/supabaseClient";

export const LoginPage = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!form.email || !form.password) {
      alert("Por favor completa todos los campos.");
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });

    if (error) {
      alert("Credenciales incorrectas.");
      return;
    }

    const user = data.user;

    // 🔎 Verificar estado activo/inactivo
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("status")
      .eq("id", user.id)
      .single();

    if (userError) {
      alert("Error verificando estado del usuario.");
      return;
    }

    if (userData.status !== "active") {
      await supabase.auth.signOut();
      alert("Tu cuenta está inactiva.");
      return;
    }

    navigate("/dashboard");
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Iniciar Sesión</h2>

        <form style={styles.form} onSubmit={handleLogin}>
          {/* Email */}
          <div style={styles.inputGroup}>
            <FaEnvelope style={styles.icon} />
            <input
              type="email"
              name="email"
              placeholder="Correo electrónico"
              style={styles.input}
              value={form.email}
              onChange={handleChange}
            />
          </div>

          {/* Password */}
          <div style={styles.inputGroup}>
            <FaLock style={styles.icon} />
            <input
              type="password"
              name="password"
              placeholder="Contraseña"
              style={styles.input}
              value={form.password}
              onChange={handleChange}
            />
          </div>

          <button type="submit" style={styles.button}>
            Entrar
          </button>
        </form>

        <p style={{ marginTop: "15px", textAlign: "center" }}>
          <a href="/register" style={{ color: "#3B82F6" }}>
            Registrar institución
          </a>
        </p>
      </div>
    </div>
  );
};

const styles: { [key: string]: CSSProperties } = {
  container: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #1E3A8A, #3B82F6)",
  },
  card: {
    backgroundColor: "#F8F5F0",
    padding: "40px",
    borderRadius: "20px",
    width: "400px",
  },
  title: {
    color: "#1E3A8A",
    textAlign: "center",
    marginBottom: "20px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },
  inputGroup: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: "10px",
    padding: "10px",
    border: "1px solid #ddd",
  },
  icon: {
    color: "#3B82F6",
    marginRight: "10px",
  },
  input: {
    border: "none",
    outline: "none",
    flex: 1,
    background: "transparent",
    fontSize: "14px",
  },
  button: {
    backgroundColor: "#1E3A8A",
    color: "white",
    padding: "12px",
    borderRadius: "10px",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
  },
};