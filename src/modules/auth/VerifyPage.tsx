import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export const VerifyPage = () => {
  const navigate = useNavigate();
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    // Simula duración de animación (3 segundos)
    const timer = setTimeout(() => {
      setShowButton(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title} className="fadeText">
          ¡Registro exitoso! <br />
          <br />
          Gracias por confiar en nosotros para administar la evaluación de tu institución 🎓. 
        </h2>

        {showButton && (
          <button
            style={styles.button}
            onClick={() => navigate("/")}
          >
            Ir al Login
          </button>
        )}
      </div>

      <style>
        {`
          .fadeText {
            animation: fadeIn 3s ease-in-out;
          }

          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </div>
  );
};

const styles = {
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
    width: "420px",
    textAlign: "center" as const,
  },
  title: {
    color: "#1E3A8A",
    marginBottom: "20px",
  },
  button: {
    marginTop: "20px",
    backgroundColor: "#1E3A8A",
    color: "white",
    padding: "12px 20px",
    borderRadius: "10px",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
  },
};