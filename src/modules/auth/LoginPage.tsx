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
    <div>
      <h1>Login Page</h1>
      <button onClick={handleLogin}>Entrar</button>
    </div>
  );
};