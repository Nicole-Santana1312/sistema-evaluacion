import { useAuth } from "../../app/providers/AuthProvider";
import { useNavigate } from "react-router-dom";

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = () => {
    login();
    navigate("/dashboard");
  };

 return (
  <div
    style={{
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <div
      style={{
        backgroundColor: "var(--color-white)",
        padding: "2rem",
        borderRadius: "12px",
        boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
        width: "300px",
        textAlign: "center",
      }}
    >
      <h1 style={{ color: "var(--color-primary)" }}>Sistema Evaluación</h1>

      <button
        onClick={handleLogin}
        style={{
          marginTop: "1rem",
          padding: "0.6rem 1rem",
          backgroundColor: "var(--color-primary)",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        Entrar
      </button>

      <p style={{ marginTop: "1rem" }}>
        <a href="/register" style={{ color: "var(--color-primary-light)" }}>
          Registrar institución
        </a>
      </p>
    </div>
  </div>
);
};