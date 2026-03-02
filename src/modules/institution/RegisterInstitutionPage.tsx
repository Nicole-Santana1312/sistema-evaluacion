import { useState } from "react";
import type { CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUser,
  FaEnvelope,
  FaLock,
  FaUniversity,
  FaGlobe,
  FaGraduationCap,
} from "react-icons/fa";
import { supabase } from "../../lib/supabaseClient";

export const RegisterInstitutionPage = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    institutionName: "",
    adminName: "",
    email: "",
    password: "",
    country: "República Dominicana",
    educationLevel: "Media",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (
      !form.institutionName ||
      !form.adminName ||
      !form.email ||
      !form.password
    ) {
      alert("Por favor completa todos los campos.");
      return;
    }

    try {
      // 1️⃣ Crear usuario en Auth
      const { data: authData, error: authError } =
        await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            emailRedirectTo: "http://localhost:5173/verify",
          },
        });

      if (authError) throw authError;

      const userId = authData.user?.id;
      if (!userId) throw new Error("No se pudo obtener el ID del usuario");

      // 2️⃣ Crear institución
      const code = crypto
        .randomUUID()
        .replace(/-/g, "")
        .slice(0, 10)
        .toUpperCase();

      const { data: institutionData, error: institutionError } =
        await supabase
          .from("institutions")
          .insert([
            {
              name: form.institutionName,
              institutional_code: code,
              country: form.country,
              education_level: form.educationLevel,
            },
          ])
          .select()
          .single();

      if (institutionError) throw institutionError;

      // Separar nombre
      const [firstName, ...rest] = form.adminName.trim().split(" ");
      const lastName = rest.join(" ") || "Admin";

      // 💾 Guardar datos para insertarlos después de verificar
      localStorage.setItem(
        "pendingUserData",
        JSON.stringify({
          institution_id: institutionData.id,
          first_name: firstName,
          last_name: lastName,
        })
      );

      alert("Revisa tu correo para verificar tu cuenta.");
      navigate("/verify");
    } catch (err: any) {
      console.error("ERROR COMPLETO:", err);
      alert("Error al registrar: " + err.message);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Crear Institución</h2>

        <form style={styles.form} onSubmit={handleSubmit}>
          {/* Nombre Institución */}
          <div style={styles.inputGroup}>
            <FaUniversity style={styles.icon} />
            <input
              type="text"
              name="institutionName"
              placeholder="Nombre de la institución"
              style={styles.input}
              value={form.institutionName}
              onChange={handleChange}
            />
          </div>

          {/* Nombre Administrador */}
          <div style={styles.inputGroup}>
            <FaUser style={styles.icon} />
            <input
              type="text"
              name="adminName"
              placeholder="Nombre del administrador"
              style={styles.input}
              value={form.adminName}
              onChange={handleChange}
            />
          </div>

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

          {/* País */}
          <div style={styles.inputGroup}>
            <FaGlobe style={styles.icon} />
            <select
              name="country"
              value={form.country}
              onChange={handleChange}
              style={styles.input}
            >
              <option value="República Dominicana">🇩🇴 República Dominicana</option>
              <option value="México">🇲🇽 México</option>
              <option value="Colombia">🇨🇴 Colombia</option>
              <option value="Argentina">🇦🇷 Argentina</option>
              <option value="España">🇪🇸 España</option>
              <option value="Estados Unidos">🇺🇸 Estados Unidos</option>
            </select>
          </div>

          {/* Nivel Educativo */}
          <div style={styles.inputGroup}>
            <FaGraduationCap style={styles.icon} />
            <select
              name="educationLevel"
              value={form.educationLevel}
              onChange={handleChange}
              style={styles.input}
            >
              <option value="Inicial">Inicial</option>
              <option value="Primaria">Primaria</option>
              <option value="Media">Media</option>
              <option value="Secundaria">Secundaria</option>
              <option value="Universitario">Universitario</option>
            </select>
          </div>

          <button type="submit" style={styles.button}>
            Registrar Institución
          </button>
        </form>
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