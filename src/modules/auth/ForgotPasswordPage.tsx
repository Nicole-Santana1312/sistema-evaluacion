const handleReset = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!email) {
    alert("Ingresa tu correo.");
    return;
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: "http://localhost:5173/update-password",
  });

  if (error) {
    alert("Error enviando el enlace.");
    return;
  }

  alert("Revisa tu correo para cambiar tu contraseña.");
};