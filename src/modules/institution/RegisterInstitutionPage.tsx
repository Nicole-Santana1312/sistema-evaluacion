import { useState } from "react";
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

  const styles: { [key: string]: CSSProperties } = {
    container: {
      minHeight: "100vh",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "20px",
    },
    card: {
      backgroundColor: "white",
      padding: "40px",
      borderRadius: "15px",
      boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
      width: "100%",
      maxWidth: "500px",
    },
    title: {
      color: "#333",
      textAlign: "center",
      marginBottom: "30px",
      fontSize: "28px",
      fontWeight: "bold",
    },
    form: {
      display: "flex",
      flexDirection: "column",
      gap: "20px",
    },
    inputGroup: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      position: "relative",
    },
    icon: {
      color: "#667eea",
      fontSize: "18px",
      minWidth: "20px",
    },
    input: {
      flex: 1,
      padding: "12px",
      border: "1px solid #ddd",
      borderRadius: "8px",
      fontSize: "14px",
      outlineColor: "#667eea",
    },
    button: {
      backgroundColor: "#667eea",
      color: "white",
      padding: "12px",
      border: "none",
      borderRadius: "8px",
      fontSize: "16px",
      fontWeight: "bold",
      cursor: "pointer",
      marginTop: "10px",
    },
  };

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

import React, { useEffect, type CSSProperties } from "react";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [activeCard, setActiveCard] = useState<string | null>(null);

  const [users, setUsers] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      const { data: u } = await supabase.from("users").select("*");
      const { data: c } = await supabase.from("subjects").select("*");
      const { data: s } = await supabase.from("sections").select("*");
      const { data: a } = await supabase.from("activities").select("*");

      setUsers(u || []);
      setCourses(c || []);
      setSections(s || []);
      setActivities(a || []);

      setTimeout(() => setLoading(false), 1200);
    };

    loadData();
  }, []);

  const styles: { [key: string]: CSSProperties } = {
    container: {
      minHeight: "100vh",
      background: "linear-gradient(135deg, #1E3A8A, #3B82F6)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "30px",
    },
    dashboardCard: {
      backgroundColor: "#F8F5F0",
      padding: "40px",
      borderRadius: "25px",
      width: "100%",
      maxWidth: "1100px",
      boxShadow: "0px 15px 40px rgba(0,0,0,0.2)",
    },
    title: {
      color: "#1E3A8A",
      textAlign: "center",
      marginBottom: "30px",
      fontSize: "28px",
      fontWeight: "bold",
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
      gap: "20px",
    },
    card: {
      backgroundColor: "white",
      padding: "25px",
      borderRadius: "18px",
      cursor: "pointer",
      transition: "all 0.3s ease",
      boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
      textAlign: "center",
    },
    cardHover: {
      transform: "translateY(-8px)",
      boxShadow: "0 12px 25px rgba(0,0,0,0.2)",
    },
    cardTitle: {
      color: "#1E3A8A",
      fontSize: "18px",
      fontWeight: "bold",
      marginBottom: "10px",
    },
    cardCount: {
      color: "#3B82F6",
      fontSize: "26px",
      fontWeight: "bold",
    },
    backButton: {
      marginTop: "20px",
      backgroundColor: "#1E3A8A",
      color: "white",
      padding: "10px 20px",
      borderRadius: "10px",
      border: "none",
      cursor: "pointer",
    },
    loaderContainer: {
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      flexDirection: "column",
      background: "linear-gradient(135deg, #1E3A8A, #3B82F6)",
      color: "white",
    },
    spinner: {
      width: "60px",
      height: "60px",
      border: "6px solid rgba(255,255,255,0.3)",
      borderTop: "6px solid white",
      borderRadius: "50%",
      animation: "spin 1s linear infinite",
      marginBottom: "20px",
    },
  };

  if (loading) {
    return (
      <div style={styles.loaderContainer}>
        <div style={styles.spinner}></div>
        <h2>Dashboard cargando...</h2>
        <style>
          {`@keyframes spin { 
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }`}
        </style>
      </div>
    );
  }

  if (activeCard) {
    return (
      <div style={styles.container}>
        <div style={styles.dashboardCard}>
          <h2 style={styles.title}>{activeCard}</h2>
          <p style={{ textAlign: "center", color: "#3B82F6" }}>
            Aquí puedes gestionar los {activeCard.toLowerCase()}.
          </p>
          <button style={styles.backButton} onClick={() => setActiveCard(null)}>
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.dashboardCard}>
        <h1 style={styles.title}>Panel Administrativo</h1>

        <div style={styles.grid}>
          {[
            { name: "Usuarios", count: users.length },
            { name: "Cursos", count: courses.length },
            { name: "Secciones", count: sections.length },
            { name: "Actividades", count: activities.length },
          ].map((item) => (
            <div
              key={item.name}
              style={styles.card}
              onMouseEnter={(e) =>
                Object.assign(e.currentTarget.style, styles.cardHover)
              }
              onMouseLeave={(e) =>
                Object.assign(e.currentTarget.style, styles.card)
              }
              onClick={() => setActiveCard(item.name)}
            >
              <div style={styles.cardTitle}>{item.name}</div>
              <div style={styles.cardCount}>{item.count}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}