import { useState } from "react";
import type { CSSProperties } from "react";
import { FaUser, FaEnvelope, FaLock, FaUniversity } from "react-icons/fa";
import { supabase } from "../../lib/supabaseClient";

export const RegisterInstitutionPage = () => {
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
      // 🔥 Generar código institucional único (UUID corto)
      const code = crypto
        .randomUUID()
        .replace(/-/g, "")
        .slice(0, 10)
        .toUpperCase();

      // 1️⃣ Crear institución
      const { data: institutionData, error: institutionError } = await supabase
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

      // 2️⃣ Crear usuario en Supabase Auth
      const { data: authData, error: authError } =
        await supabase.auth.signUp({
          email: form.email,
          password: form.password,
        });

      if (authError) throw authError;

      const userId = authData.user?.id;
      if (!userId) throw new Error("No se pudo obtener el ID del usuario");

      // Separar nombre
      const [firstName, ...rest] = form.adminName.trim().split(" ");
      const lastName = rest.join(" ") || "Admin";

      // 3️⃣ Insertar en tabla personalizada users
      const { error: userError } = await supabase.from("users").insert([
        {
          id: userId,
          institution_id: institutionData.id,
          first_name: firstName,
          last_name: lastName,
          status: "active",
        },
      ]);

      if (userError) throw userError;

      // 4️⃣ Asignar rol super_admin
      const { data: roleData, error: roleError } = await supabase
        .from("roles")
        .select("id")
        .eq("name", "super_admin")
        .single();

      if (roleError) throw roleError;

      const { error: roleAssignError } = await supabase
        .from("user_roles")
        .insert([
          { user_id: userId, role_id: roleData.id },
        ]);

      if (roleAssignError) throw roleAssignError;

      alert("Institución y administrador registrados correctamente ✅");

      // Limpiar formulario
      setForm({
        institutionName: "",
        adminName: "",
        email: "",
        password: "",
        country: "República Dominicana",
        educationLevel: "Media",
      });
    } catch (err: any) {
      console.error("ERROR COMPLETO:", err);
      alert("Error al registrar: " + err.message);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logoContainer}>
          <div style={styles.logoPlaceholder}>LOGO</div>
          <h2 style={styles.title}>Crear Institución</h2>
        </div>

        <form style={styles.form} onSubmit={handleSubmit}>
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

          <div style={styles.inputGroup}>
            <input
              type="text"
              name="country"
              placeholder="País"
              style={styles.input}
              value={form.country}
              onChange={handleChange}
            />
          </div>

          <div style={styles.inputGroup}>
            <input
              type="text"
              name="educationLevel"
              placeholder="Nivel educativo"
              style={styles.input}
              value={form.educationLevel}
              onChange={handleChange}
            />
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
    boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
  },
  logoContainer: {
    textAlign: "center",
    marginBottom: "30px",
  },
  logoPlaceholder: {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    backgroundColor: "#1E3A8A",
    color: "white",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    margin: "0 auto 15px auto",
    fontWeight: "bold",
  },
  title: {
    color: "#1E3A8A",
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
    marginTop: "10px",
  },
};