interface RegisterInstitutionDTO {
  name: string;
  code: string;
  country: string;
  level: string;
  adminEmail: string;
  adminPassword: string;
}

export const registerInstitution = (data: RegisterInstitutionDTO) => {
  // Validar email duplicado
  const existingInstitutions = JSON.parse(
    localStorage.getItem("institutions") || "[]"
  );

  const emailExists = existingInstitutions.some(
    (inst: any) => inst.admin.email === data.adminEmail
  );

  if (emailExists) {
    throw new Error("El email ya está registrado.");
  }

  // Crear estructura SaaS realista
  const newInstitution = {
    id: crypto.randomUUID(),
    name: data.name,
    code: data.code,
    country: data.country,
    level: data.level,
    createdAt: new Date().toISOString(),
    admin: {
      id: crypto.randomUUID(),
      email: data.adminEmail,
      password: data.adminPassword,
      role: "DIRECTOR_ACADEMICO",
      active: true,
    },
  };

  existingInstitutions.push(newInstitution);

  localStorage.setItem("institutions", JSON.stringify(existingInstitutions));

  return newInstitution;
};