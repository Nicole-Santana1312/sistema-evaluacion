import React, { useEffect, useState, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

type ActiveCard = "Usuarios" | "Cursos" | "Secciones" | "Actividades" | null;

// ─── Helpers ────────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "¡Buenos días";
  if (h < 18) return "¡Buenas tardes";
  return "¡Buenas noches";
}

const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  active:               { bg: "#D1FAE5", text: "#059669" },
  inactive:             { bg: "#F3F4F6", text: "#6B7280" },
  suspended:            { bg: "#FEE2E2", text: "#DC2626" },
  pending_verification: { bg: "#FEF3C7", text: "#D97706" },
  draft:                { bg: "#F3F4F6", text: "#6B7280" },
  published:            { bg: "#D1FAE5", text: "#059669" },
  closed:               { bg: "#EDE9FE", text: "#7C3AED" },
  pendiente:            { bg: "#FEF3C7", text: "#D97706" },
  "en revisión":        { bg: "#DBEAFE", text: "#2563EB" },
  resuelto:             { bg: "#D1FAE5", text: "#059669" },
};

const ROLE_LABEL: Record<string, string> = {
  super_admin: "Super Admin", academic_director: "Director Académico",
  coordinator: "Coordinador", teacher: "Docente",
  student: "Estudiante", parent_tutor: "Tutor", auditor: "Auditor",
};

const ACTIVITY_ICON: Record<string, string> = {
  project:"📁", exam:"📝", task:"✅", practice:"🔬",
  observation:"👁️", digital_evidence:"💾", other:"📌",
};

const TYPE_LABEL: Record<string, string> = {
  project:"Proyecto", exam:"Examen", task:"Tarea", practice:"Práctica",
  observation:"Observación", digital_evidence:"Evidencia Digital", other:"Otro",
};

const FAKE_COMPLAINTS = [
  { id:1, teacher:"Prof. Martínez", subject:"Matemáticas", avatar:"M", color:"#E74C3C", time:"Hace 2 horas", message:"Los estudiantes no tienen acceso al material de la semana 3.", status:"pendiente" },
  { id:2, teacher:"Prof. Rodríguez", subject:"Historia", avatar:"R", color:"#8E44AD", time:"Hace 5 horas", message:"El aula virtual de la sección 4B no carga desde el jueves.", status:"en revisión" },
  { id:3, teacher:"Prof. López", subject:"Ciencias", avatar:"L", color:"#27AE60", time:"Ayer", message:"Solicito habilitar subida de video en las entregas.", status:"resuelto" },
  { id:4, teacher:"Prof. García", subject:"Lenguaje", avatar:"G", color:"#F39C12", time:"Hace 2 días", message:"El sistema no guarda las notas correctamente.", status:"pendiente" },
];

// ─── Shared UI ──────────────────────────────────────────────────────────────

function Badge({ status, label }: { status: string; label?: string }) {
  const c = STATUS_COLOR[status] || { bg: "#F3F4F6", text: "#6B7280" };
  return (
    <span style={{ backgroundColor:c.bg, color:c.text, borderRadius:20, padding:"3px 11px",
      fontSize:11, fontWeight:700, textTransform:"capitalize" as const, whiteSpace:"nowrap" as const }}>
      {label || status.replace(/_/g," ")}
    </span>
  );
}

function StatMini({ val, label, color, bg }: { val:number; label:string; color:string; bg:string }) {
  return (
    <div style={{ backgroundColor:bg, borderRadius:16, padding:"18px 22px" }}>
      <div style={{ fontSize:26, fontWeight:800, color }}>{val}</div>
      <div style={{ fontSize:13, color, opacity:.8, marginTop:2 }}>{label}</div>
    </div>
  );
}

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return <th style={{ padding:"12px 18px", textAlign:right?"right":"left", fontSize:11, fontWeight:700,
    color:"#94A3B8", textTransform:"uppercase" as const, letterSpacing:1,
    borderBottom:"1px solid #F1F5F9", whiteSpace:"nowrap" as const }}>{children}</th>;
}
function Td({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return <td style={{ padding:"12px 18px", fontSize:14, color:"#334155",
    textAlign:right?"right":"left", borderBottom:"1px solid #F8FAFC",
    verticalAlign:"middle" as const }}>{children}</td>;
}

function SearchBar({ value, onChange, placeholder }: { value:string; onChange:(v:string)=>void; placeholder:string }) {
  return (
    <input placeholder={`🔍  ${placeholder}`} value={value} onChange={e=>onChange(e.target.value)}
      style={{ flex:1, minWidth:200, padding:"10px 16px", borderRadius:10,
        border:"1px solid #E2E8F0", fontSize:14, outline:"none", backgroundColor:"white" }} />
  );
}

function FilterBtn({ active, color, onClick, children }: { active:boolean; color:string; onClick:()=>void; children:React.ReactNode }) {
  return (
    <button onClick={onClick} style={{ padding:"7px 15px", borderRadius:20, border:"none",
      cursor:"pointer", fontSize:12, fontWeight:600,
      backgroundColor:active?color:"#F1F5F9", color:active?"white":"#64748B" }}>
      {children}
    </button>
  );
}

// ─── MODAL ──────────────────────────────────────────────────────────────────

function Modal({ title, onClose, children, accent = "#1E3A8A" }:
  { title:string; onClose:()=>void; children:React.ReactNode; accent?:string }) {
  return (
    <div style={{ position:"fixed", inset:0, backgroundColor:"rgba(15,23,42,0.55)",
      display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000,
      backdropFilter:"blur(4px)", padding:16 }}
      onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ backgroundColor:"white", borderRadius:20,
        width:"100%", maxWidth:560, maxHeight:"90vh", overflow:"auto",
        boxShadow:"0 24px 64px rgba(0,0,0,0.25)", animation:"slideUp .25s ease" }}>
        {/* Header */}
        <div style={{ background:`linear-gradient(135deg, ${accent}, ${accent}cc)`,
          padding:"24px 28px", borderRadius:"20px 20px 0 0",
          display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <h2 style={{ color:"white", fontSize:20, fontFamily:"Georgia,serif", margin:0 }}>{title}</h2>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.2)", border:"none",
            color:"white", borderRadius:"50%", width:32, height:32, cursor:"pointer",
            fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
        </div>
        <div style={{ padding:"28px" }}>{children}</div>
      </div>
    </div>
  );
}

function FormField({ label, children, required }: { label:string; children:React.ReactNode; required?:boolean }) {
  return (
    <div style={{ marginBottom:18 }}>
      <label style={{ display:"block", fontSize:13, fontWeight:600, color:"#374151", marginBottom:6 }}>
        {label}{required && <span style={{ color:"#EF4444", marginLeft:4 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width:"100%", padding:"10px 14px", borderRadius:10, border:"1px solid #E5E7EB",
  fontSize:14, outline:"none", boxSizing:"border-box" as const, color:"#1E293B",
  backgroundColor:"white",
};

const selectStyle = { ...inputStyle, cursor:"pointer" };

function SubmitBtn({ loading, label, color = "#1E3A8A" }: { loading:boolean; label:string; color?:string }) {
  return (
    <button disabled={loading} type="submit"
      style={{ width:"100%", padding:"13px", borderRadius:12, border:"none",
        background:`linear-gradient(135deg, ${color}, ${color}cc)`,
        color:"white", fontSize:15, fontWeight:700, cursor:loading?"not-allowed":"pointer",
        opacity:loading?.7:1, marginTop:8 }}>
      {loading ? "Guardando..." : label}
    </button>
  );
}

// ─── PAGE SHELL ─────────────────────────────────────────────────────────────

function PageShell({ title, subtitle, icon, accent, onBack, onNew, newLabel, children }:
  { title:string; subtitle:string; icon:string; accent:string;
    onBack:()=>void; onNew:()=>void; newLabel:string; children:React.ReactNode }) {
  return (
    <div style={{ minHeight:"100vh", backgroundColor:"#F1F5F9", fontFamily:"'Segoe UI',Georgia,sans-serif" }}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        .rh:hover{background:#F8FAFC !important}
        .btn-new:hover{opacity:.88 !important}
      `}</style>
      <div style={{ background:`linear-gradient(135deg,#1E3A8A 0%,${accent} 60%,#3B82F6 100%)`,
        padding:"32px 48px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute",top:-60,right:-60,width:220,height:220,
          borderRadius:"50%",background:"rgba(255,255,255,0.07)" }} />
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:16 }}>
          <div>
            <button onClick={onBack} style={{ background:"rgba(255,255,255,0.15)", border:"1px solid rgba(255,255,255,0.25)",
              color:"white", borderRadius:10, padding:"8px 18px", cursor:"pointer", fontSize:13, marginBottom:16,
              backdropFilter:"blur(6px)" }}>
              ← Volver al panel
            </button>
            <div style={{ display:"flex", alignItems:"center", gap:14 }}>
              <span style={{ fontSize:42 }}>{icon}</span>
              <div>
                <h1 style={{ color:"white", fontSize:28, fontFamily:"Georgia,serif", margin:0 }}>{title}</h1>
                <p style={{ color:"rgba(255,255,255,0.75)", margin:"6px 0 0", fontSize:14 }}>{subtitle}</p>
              </div>
            </div>
          </div>
          <button className="btn-new" onClick={onNew}
            style={{ alignSelf:"flex-end", backgroundColor:"white", color:accent,
              border:"none", borderRadius:12, padding:"12px 22px", fontWeight:700,
              fontSize:14, cursor:"pointer", boxShadow:"0 4px 14px rgba(0,0,0,0.15)",
              display:"flex", alignItems:"center", gap:8, whiteSpace:"nowrap" as const }}>
            <span style={{ fontSize:18 }}>+</span> {newLabel}
          </button>
        </div>
      </div>
      <div style={{ padding:"36px 48px" }}>{children}</div>
    </div>
  );
}

function TableCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor:"white", borderRadius:20, boxShadow:"0 4px 20px rgba(0,0,0,0.07)",
      overflow:"hidden", animation:"fadeUp .4s ease both" }}>
      {children}
    </div>
  );
}

// ─── USUARIOS PAGE ───────────────────────────────────────────────────────────

function UsersPage({ onBack }: { onBack:()=>void }) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    first_name:"", last_name:"", email:"", phone:"", status:"pending_verification", role:"student"
  });
  const [toast, setToast] = useState<string|null>(null);

  const fetchUsers = () => {
    supabase.from("users")
      .select("id, first_name, last_name, status, created_at, phone, user_roles(roles(name))")
      .then(({ data }) => { setUsers(data||[]); setLoading(false); });
  };
  useEffect(fetchUsers, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(()=>setToast(null),3000); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // 1. Create auth user via supabase auth (signUp) — then insert profile
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: form.email,
        password: Math.random().toString(36).slice(-10) + "A1!", // temp password
      });
      if (authErr) throw authErr;
      const userId = authData.user?.id;
      if (!userId) throw new Error("No se pudo crear el usuario");

      // 2. Insert into users table
      const { error: profileErr } = await supabase.from("users").insert({
        id: userId,
        first_name: form.first_name,
        last_name: form.last_name,
        phone: form.phone || null,
        status: form.status,
      });
      if (profileErr) throw profileErr;

      // 3. Assign role
      const { data: roleRow } = await supabase.from("roles").select("id").eq("name", form.role).single();
      if (roleRow) {
        await supabase.from("user_roles").insert({ user_id: userId, role_id: roleRow.id });
      }

      showToast(`✅ Usuario ${form.first_name} ${form.last_name} creado`);
      setShowModal(false);
      setForm({ first_name:"", last_name:"", email:"", phone:"", status:"pending_verification", role:"student" });
      fetchUsers();
    } catch (err: any) {
      showToast(`❌ Error: ${err.message}`);
    } finally { setSaving(false); }
  };

  const filtered = users.filter(u => {
    const name = `${u.first_name} ${u.last_name}`.toLowerCase();
    return name.includes(search.toLowerCase()) && (filter==="all"||u.status===filter);
  });

  return (
    <PageShell title="Gestión de Usuarios" subtitle={`${users.length} usuarios registrados`}
      icon="👤" accent="#2563EB" onBack={onBack} onNew={()=>setShowModal(true)} newLabel="Nuevo usuario">

      {toast && <Toast msg={toast} />}

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:16, marginBottom:28 }}>
        <StatMini val={users.length} label="Total" color="#1E3A8A" bg="#EFF6FF" />
        <StatMini val={users.filter(u=>u.status==="active").length} label="Activos" color="#059669" bg="#D1FAE5" />
        <StatMini val={users.filter(u=>u.status==="pending_verification").length} label="Pendientes" color="#D97706" bg="#FEF3C7" />
        <StatMini val={users.filter(u=>u.status==="suspended").length} label="Suspendidos" color="#DC2626" bg="#FEE2E2" />
      </div>

      <TableCard>
        <div style={{ padding:"18px 24px", display:"flex", gap:12, flexWrap:"wrap", borderBottom:"1px solid #F1F5F9", alignItems:"center" }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Buscar usuario..." />
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {["all","active","inactive","suspended","pending_verification"].map(s=>(
              <FilterBtn key={s} active={filter===s} color="#1E3A8A" onClick={()=>setFilter(s)}>
                {s==="all"?"Todos":s.replace(/_/g," ")}
              </FilterBtn>
            ))}
          </div>
        </div>
        {loading ? <LoadingRow /> : (
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead style={{ backgroundColor:"#FAFAFA" }}>
                <tr><Th>Usuario</Th><Th>Teléfono</Th><Th>Rol</Th><Th>Estado</Th><Th>Registro</Th></tr>
              </thead>
              <tbody>
                {filtered.length===0 ? <EmptyRow cols={5} /> : filtered.map(u=>{
                  const role = u.user_roles?.[0]?.roles?.name;
                  const initials = `${u.first_name?.[0]||""}${u.last_name?.[0]||""}`.toUpperCase();
                  return (
                    <tr key={u.id} className="rh" style={{ backgroundColor:"white" }}>
                      <Td>
                        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                          <div style={{ width:38,height:38,borderRadius:"50%",
                            background:"linear-gradient(135deg,#1E3A8A,#3B82F6)",
                            color:"white",display:"flex",alignItems:"center",justifyContent:"center",
                            fontWeight:700,fontSize:14,flexShrink:0 }}>{initials}</div>
                          <span style={{ fontWeight:600, color:"#1E293B" }}>{u.first_name} {u.last_name}</span>
                        </div>
                      </Td>
                      <Td>{u.phone||<span style={{ color:"#CBD5E1" }}>—</span>}</Td>
                      <Td>{role?<span style={{ backgroundColor:"#EFF6FF",color:"#1E3A8A",borderRadius:8,padding:"3px 10px",fontSize:12,fontWeight:600 }}>{ROLE_LABEL[role]||role}</span>:<span style={{ color:"#CBD5E1" }}>Sin rol</span>}</Td>
                      <Td><Badge status={u.status} /></Td>
                      <Td>{new Date(u.created_at).toLocaleDateString("es-ES")}</Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </TableCard>

      {showModal && (
        <Modal title="Crear nuevo usuario" onClose={()=>setShowModal(false)} accent="#1E3A8A">
          <form onSubmit={handleSubmit}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
              <FormField label="Nombre" required>
                <input style={inputStyle} required value={form.first_name}
                  onChange={e=>setForm({...form,first_name:e.target.value})} placeholder="Ej: María" />
              </FormField>
              <FormField label="Apellido" required>
                <input style={inputStyle} required value={form.last_name}
                  onChange={e=>setForm({...form,last_name:e.target.value})} placeholder="Ej: González" />
              </FormField>
            </div>
            <FormField label="Correo electrónico" required>
              <input style={inputStyle} type="email" required value={form.email}
                onChange={e=>setForm({...form,email:e.target.value})} placeholder="correo@institución.edu" />
            </FormField>
            <FormField label="Teléfono">
              <input style={inputStyle} value={form.phone}
                onChange={e=>setForm({...form,phone:e.target.value})} placeholder="+1 809 000 0000" />
            </FormField>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
              <FormField label="Rol" required>
                <select style={selectStyle} value={form.role} onChange={e=>setForm({...form,role:e.target.value})}>
                  {Object.entries(ROLE_LABEL).map(([v,l])=><option key={v} value={v}>{l}</option>)}
                </select>
              </FormField>
              <FormField label="Estado">
                <select style={selectStyle} value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>
                  <option value="pending_verification">Pendiente verificación</option>
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                  <option value="suspended">Suspendido</option>
                </select>
              </FormField>
            </div>
            <div style={{ backgroundColor:"#FEF3C7", borderRadius:10, padding:"10px 14px", fontSize:13, color:"#92400E", marginBottom:16 }}>
              ℹ️ Se enviará un correo de verificación al usuario para que establezca su contraseña.
            </div>
            <SubmitBtn loading={saving} label="Crear usuario" color="#1E3A8A" />
          </form>
        </Modal>
      )}
    </PageShell>
  );
}

// ─── CURSOS PAGE ─────────────────────────────────────────────────────────────

function CoursesPage({ onBack }: { onBack:()=>void }) {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name:"", code:"", description:"", is_active:true });
  const [toast, setToast] = useState<string|null>(null);

  const fetchSubjects = () => {
    supabase.from("subjects")
      .select("id, name, code, description, is_active, created_at, subject_assignments(id)")
      .then(({ data })=>{ setSubjects(data||[]); setLoading(false); });
  };
  useEffect(fetchSubjects, []);

  const showToast = (msg:string) => { setToast(msg); setTimeout(()=>setToast(null),3000); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      // Get institution_id from current user's profile
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase.from("users").select("institution_id").eq("id", user?.id).single();
      const { error } = await supabase.from("subjects").insert({
        name: form.name, code: form.code||null,
        description: form.description||null,
        is_active: form.is_active,
        institution_id: profile?.institution_id,
      });
      if (error) throw error;
      showToast(`✅ Curso "${form.name}" creado`);
      setShowModal(false);
      setForm({ name:"", code:"", description:"", is_active:true });
      fetchSubjects();
    } catch (err:any) { showToast(`❌ Error: ${err.message}`); }
    finally { setSaving(false); }
  };

  const filtered = subjects.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) || (s.code||"").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PageShell title="Gestión de Cursos" subtitle={`${subjects.length} materias configuradas`}
      icon="📚" accent="#7C3AED" onBack={onBack} onNew={()=>setShowModal(true)} newLabel="Nueva materia">

      {toast && <Toast msg={toast} />}

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:16, marginBottom:28 }}>
        <StatMini val={subjects.length} label="Total" color="#7C3AED" bg="#F5F3FF" />
        <StatMini val={subjects.filter(s=>s.is_active).length} label="Activos" color="#059669" bg="#D1FAE5" />
        <StatMini val={subjects.filter(s=>!s.is_active).length} label="Inactivos" color="#DC2626" bg="#FEE2E2" />
        <StatMini val={subjects.filter(s=>s.subject_assignments?.length>0).length} label="Con asignaciones" color="#D97706" bg="#FEF3C7" />
      </div>

      <TableCard>
        <div style={{ padding:"18px 24px", borderBottom:"1px solid #F1F5F9" }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Buscar por nombre o código..." />
        </div>
        {loading ? <LoadingRow /> : (
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead style={{ backgroundColor:"#FAFAFA" }}>
                <tr><Th>Materia</Th><Th>Código</Th><Th>Descripción</Th><Th>Asignaciones</Th><Th>Estado</Th><Th>Creado</Th></tr>
              </thead>
              <tbody>
                {filtered.length===0 ? <EmptyRow cols={6} /> : filtered.map(s=>(
                  <tr key={s.id} className="rh" style={{ backgroundColor:"white" }}>
                    <Td>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <div style={{ width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,#7C3AED,#A78BFA)",
                          display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0 }}>📚</div>
                        <span style={{ fontWeight:600, color:"#1E293B" }}>{s.name}</span>
                      </div>
                    </Td>
                    <Td>{s.code?<code style={{ backgroundColor:"#F1F5F9",padding:"2px 8px",borderRadius:6,fontSize:12 }}>{s.code}</code>:<span style={{ color:"#CBD5E1" }}>—</span>}</Td>
                    <Td><span style={{ color:"#64748B",fontSize:13 }}>{s.description?s.description.slice(0,60)+(s.description.length>60?"…":""):"—"}</span></Td>
                    <Td><span style={{ backgroundColor:"#EFF6FF",color:"#1E3A8A",borderRadius:8,padding:"3px 10px",fontSize:12,fontWeight:600 }}>{s.subject_assignments?.length||0} asig.</span></Td>
                    <Td><Badge status={s.is_active?"active":"inactive"} label={s.is_active?"Activo":"Inactivo"} /></Td>
                    <Td>{new Date(s.created_at).toLocaleDateString("es-ES")}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </TableCard>

      {showModal && (
        <Modal title="Crear nueva materia" onClose={()=>setShowModal(false)} accent="#7C3AED">
          <form onSubmit={handleSubmit}>
            <FormField label="Nombre de la materia" required>
              <input style={inputStyle} required value={form.name}
                onChange={e=>setForm({...form,name:e.target.value})} placeholder="Ej: Matemáticas I" />
            </FormField>
            <FormField label="Código">
              <input style={inputStyle} value={form.code}
                onChange={e=>setForm({...form,code:e.target.value})} placeholder="Ej: MAT-101" />
            </FormField>
            <FormField label="Descripción">
              <textarea style={{ ...inputStyle, height:90, resize:"vertical" as const }}
                value={form.description} onChange={e=>setForm({...form,description:e.target.value})}
                placeholder="Descripción opcional de la materia..." />
            </FormField>
            <FormField label="Estado">
              <select style={selectStyle} value={form.is_active?"active":"inactive"}
                onChange={e=>setForm({...form,is_active:e.target.value==="active"})}>
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
              </select>
            </FormField>
            <SubmitBtn loading={saving} label="Crear materia" color="#7C3AED" />
          </form>
        </Modal>
      )}
    </PageShell>
  );
}

// ─── SECCIONES PAGE ──────────────────────────────────────────────────────────

function SectionsPage({ onBack }: { onBack:()=>void }) {
  const [sections, setSections] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name:"", grade_id:"", capacity:"" });
  const [toast, setToast] = useState<string|null>(null);

  const fetchAll = async () => {
    const [{ data:s },{ data:g }] = await Promise.all([
      supabase.from("sections").select("id,name,capacity,grades(name,education_levels(name)),section_teachers(user_id),enrollments(id)"),
      supabase.from("grades").select("id,name,sequence,education_levels(name)").order("sequence"),
    ]);
    setSections(s||[]); setGrades(g||[]); setLoading(false);
  };
  useEffect(() => { fetchAll(); },[]);

  const showToast = (msg:string) => { setToast(msg); setTimeout(()=>setToast(null),3000); };

  const handleSubmit = async (e:React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      const { error } = await supabase.from("sections").insert({
        name: form.name,
        grade_id: form.grade_id,
        capacity: form.capacity ? parseInt(form.capacity) : null,
      });
      if (error) throw error;
      showToast(`✅ Sección "${form.name}" creada`);
      setShowModal(false);
      setForm({ name:"", grade_id:"", capacity:"" });
      fetchAll();
    } catch (err:any) { showToast(`❌ Error: ${err.message}`); }
    finally { setSaving(false); }
  };

  const filtered = sections.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) || (s.grades?.name||"").toLowerCase().includes(search.toLowerCase())
  );
  const totalStudents = sections.reduce((acc,s)=>acc+(s.enrollments?.length||0),0);

  return (
    <PageShell title="Gestión de Secciones" subtitle={`${sections.length} secciones registradas`}
      icon="🏫" accent="#0F766E" onBack={onBack} onNew={()=>setShowModal(true)} newLabel="Nueva sección">

      {toast && <Toast msg={toast} />}

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:16, marginBottom:28 }}>
        <StatMini val={sections.length} label="Total" color="#0F766E" bg="#F0FDFA" />
        <StatMini val={sections.filter(s=>s.section_teachers?.length>0).length} label="Con docente" color="#059669" bg="#D1FAE5" />
        <StatMini val={sections.filter(s=>!s.section_teachers?.length).length} label="Sin docente" color="#DC2626" bg="#FEE2E2" />
        <StatMini val={totalStudents} label="Estudiantes" color="#0F766E" bg="#CCFBF1" />
      </div>

      <TableCard>
        <div style={{ padding:"18px 24px", borderBottom:"1px solid #F1F5F9" }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Buscar sección o grado..." />
        </div>
        {loading ? <LoadingRow /> : (
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead style={{ backgroundColor:"#FAFAFA" }}>
                <tr><Th>Sección</Th><Th>Grado</Th><Th>Nivel</Th><Th>Docentes</Th><Th>Estudiantes</Th><Th>Capacidad</Th></tr>
              </thead>
              <tbody>
                {filtered.length===0 ? <EmptyRow cols={6} /> : filtered.map(s=>{
                  const enrolled=s.enrollments?.length||0, cap=s.capacity||0;
                  const pct=cap>0?Math.min(100,Math.round((enrolled/cap)*100)):0;
                  const barColor=pct>=90?"#DC2626":pct>=70?"#D97706":"#059669";
                  return (
                    <tr key={s.id} className="rh" style={{ backgroundColor:"white" }}>
                      <Td>
                        <div style={{ width:38,height:38,borderRadius:10,background:"linear-gradient(135deg,#0F766E,#2DD4BF)",
                          display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:800,fontSize:16 }}>{s.name}</div>
                      </Td>
                      <Td>{s.grades?.name||<span style={{ color:"#CBD5E1" }}>—</span>}</Td>
                      <Td>{s.grades?.education_levels?.name?<span style={{ backgroundColor:"#F0FDFA",color:"#0F766E",borderRadius:8,padding:"3px 10px",fontSize:12,fontWeight:600 }}>{s.grades.education_levels.name}</span>:<span style={{ color:"#CBD5E1" }}>—</span>}</Td>
                      <Td>{s.section_teachers?.length>0?<span style={{ backgroundColor:"#D1FAE5",color:"#059669",borderRadius:8,padding:"3px 10px",fontSize:12,fontWeight:600 }}>{s.section_teachers.length} docente{s.section_teachers.length>1?"s":""}</span>:<span style={{ backgroundColor:"#FEE2E2",color:"#DC2626",borderRadius:8,padding:"3px 10px",fontSize:12,fontWeight:600 }}>⚠️ Sin docente</span>}</Td>
                      <Td>{enrolled}</Td>
                      <Td>{cap>0?(<div><div style={{ fontSize:12,color:"#64748B",marginBottom:4 }}>{enrolled}/{cap} ({pct}%)</div><div style={{ height:6,backgroundColor:"#F1F5F9",borderRadius:4,width:100 }}><div style={{ height:6,backgroundColor:barColor,borderRadius:4,width:`${pct}%` }} /></div></div>):<span style={{ color:"#CBD5E1" }}>Sin límite</span>}</Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </TableCard>

      {showModal && (
        <Modal title="Crear nueva sección" onClose={()=>setShowModal(false)} accent="#0F766E">
          <form onSubmit={handleSubmit}>
            <FormField label="Nombre / Identificador de sección" required>
              <input style={inputStyle} required value={form.name}
                onChange={e=>setForm({...form,name:e.target.value})} placeholder="Ej: A, B, Matutino" />
            </FormField>
            <FormField label="Grado" required>
              <select style={selectStyle} required value={form.grade_id}
                onChange={e=>setForm({...form,grade_id:e.target.value})}>
                <option value="">— Seleccionar grado —</option>
                {grades.map(g=>(
                  <option key={g.id} value={g.id}>
                    {g.name}{g.education_levels?.name?` (${g.education_levels.name})`:""}
                  </option>
                ))}
              </select>
              {grades.length===0 && <p style={{ color:"#EF4444",fontSize:12,marginTop:6 }}>⚠️ No hay grados creados aún.</p>}
            </FormField>
            <FormField label="Capacidad máxima">
              <input style={inputStyle} type="number" min="1" max="100" value={form.capacity}
                onChange={e=>setForm({...form,capacity:e.target.value})} placeholder="Ej: 30 (opcional)" />
            </FormField>
            <SubmitBtn loading={saving} label="Crear sección" color="#0F766E" />
          </form>
        </Modal>
      )}
    </PageShell>
  );
}

// ─── ACTIVIDADES PAGE ────────────────────────────────────────────────────────

function ActivitiesPage({ onBack }: { onBack:()=>void }) {
  const [activities, setActivities] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [outcomes, setOutcomes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string|null>(null);
  const [form, setForm] = useState({
    name:"", description:"", type:"task", max_score:"100",
    weight_in_ra:"", due_date:"", allows_resubmission:false,
    allows_self_eval:false, allows_peer_eval:false,
    subject_assignment_id:"", learning_outcome_id:"", status:"draft",
  });

  const fetchAll = async () => {
    const [{ data:a },{ data:sa },{ data:lo }] = await Promise.all([
      supabase.from("activities").select("id,name,type,status,max_score,weight_in_ra,due_date,allows_resubmission,created_at,subject_assignments(subjects(name))"),
      supabase.from("subject_assignments").select("id,subjects(name),sections(name),academic_periods(name)"),
      supabase.from("learning_outcomes").select("id,code,description"),
    ]);
    setActivities(a||[]); setAssignments(sa||[]); setOutcomes(lo||[]); setLoading(false);
  };
  useEffect(() => { fetchAll(); },[]);

  const showToast = (msg:string) => { setToast(msg); setTimeout(()=>setToast(null),3000); };

  const handleSubmit = async (e:React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      const { error } = await supabase.from("activities").insert({
        name: form.name, description: form.description||null,
        type: form.type, max_score: parseFloat(form.max_score),
        weight_in_ra: form.weight_in_ra ? parseFloat(form.weight_in_ra) : null,
        due_date: form.due_date || null,
        allows_resubmission: form.allows_resubmission,
        allows_self_eval: form.allows_self_eval,
        allows_peer_eval: form.allows_peer_eval,
        subject_assignment_id: form.subject_assignment_id,
        learning_outcome_id: form.learning_outcome_id || null,
        status: form.status,
      });
      if (error) throw error;
      showToast(`✅ Actividad "${form.name}" creada`);
      setShowModal(false);
      setForm({ name:"",description:"",type:"task",max_score:"100",weight_in_ra:"",due_date:"",
        allows_resubmission:false,allows_self_eval:false,allows_peer_eval:false,
        subject_assignment_id:"",learning_outcome_id:"",status:"draft" });
      fetchAll();
    } catch(err:any){ showToast(`❌ Error: ${err.message}`); }
    finally { setSaving(false); }
  };

  const now = new Date();
  const filtered = activities.filter(a=>
    a.name.toLowerCase().includes(search.toLowerCase()) &&
    (filterStatus==="all"||a.status===filterStatus) &&
    (filterType==="all"||a.type===filterType)
  );

  return (
    <PageShell title="Gestión de Actividades" subtitle={`${activities.length} actividades en el sistema`}
      icon="✅" accent="#B45309" onBack={onBack} onNew={()=>setShowModal(true)} newLabel="Nueva actividad">

      {toast && <Toast msg={toast} />}

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:16, marginBottom:28 }}>
        <StatMini val={activities.length} label="Total" color="#B45309" bg="#FFFBEB" />
        <StatMini val={activities.filter(a=>a.status==="published").length} label="Publicadas" color="#059669" bg="#D1FAE5" />
        <StatMini val={activities.filter(a=>a.status==="draft").length} label="Borrador" color="#6B7280" bg="#F3F4F6" />
        <StatMini val={activities.filter(a=>a.due_date&&new Date(a.due_date)<now&&a.status!=="closed").length} label="Vencidas" color="#DC2626" bg="#FEE2E2" />
      </div>

      <TableCard>
        <div style={{ padding:"18px 24px", display:"flex", gap:12, flexWrap:"wrap", borderBottom:"1px solid #F1F5F9", alignItems:"center" }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Buscar actividad..." />
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {["all","draft","published","closed"].map(s=>(
              <FilterBtn key={s} active={filterStatus===s} color="#B45309" onClick={()=>setFilterStatus(s)}>
                {s==="all"?"Todos":s.charAt(0).toUpperCase()+s.slice(1)}
              </FilterBtn>
            ))}
          </div>
          <select value={filterType} onChange={e=>setFilterType(e.target.value)}
            style={{ padding:"9px 14px",borderRadius:10,border:"1px solid #E2E8F0",fontSize:13,color:"#475569",outline:"none",cursor:"pointer",backgroundColor:"white" }}>
            <option value="all">Todos los tipos</option>
            {Object.entries(TYPE_LABEL).map(([v,l])=><option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        {loading ? <LoadingRow /> : (
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead style={{ backgroundColor:"#FAFAFA" }}>
                <tr><Th>Actividad</Th><Th>Tipo</Th><Th>Materia</Th><Th>Puntaje</Th><Th>Peso RA</Th><Th>Fecha límite</Th><Th>Estado</Th></tr>
              </thead>
              <tbody>
                {filtered.length===0 ? <EmptyRow cols={7} /> : filtered.map(a=>{
                  const isOverdue=a.due_date&&new Date(a.due_date)<now&&a.status!=="closed";
                  return (
                    <tr key={a.id} className="rh" style={{ backgroundColor:"white" }}>
                      <Td>
                        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                          <span style={{ fontSize:22 }}>{ACTIVITY_ICON[a.type]||"📌"}</span>
                          <div>
                            <div style={{ fontWeight:600,color:"#1E293B",maxWidth:200 }}>{a.name}</div>
                            {a.allows_resubmission&&<div style={{ fontSize:11,color:"#7C3AED",marginTop:2 }}>↩ Permite reentrega</div>}
                          </div>
                        </div>
                      </Td>
                      <Td><span style={{ backgroundColor:"#FFFBEB",color:"#B45309",borderRadius:8,padding:"3px 10px",fontSize:12,fontWeight:600 }}>{TYPE_LABEL[a.type]||a.type}</span></Td>
                      <Td><span style={{ color:"#475569",fontSize:13 }}>{a.subject_assignments?.subjects?.name||"—"}</span></Td>
                      <Td><span style={{ fontWeight:700 }}>{a.max_score}</span><span style={{ color:"#94A3B8",fontSize:12 }}> pts</span></Td>
                      <Td>{a.weight_in_ra!=null?`${a.weight_in_ra}%`:<span style={{ color:"#CBD5E1" }}>—</span>}</Td>
                      <Td>{a.due_date?<span style={{ color:isOverdue?"#DC2626":"#334155",fontWeight:isOverdue?700:400 }}>{isOverdue?"⚠️ ":""}{new Date(a.due_date).toLocaleDateString("es-ES")}</span>:<span style={{ color:"#CBD5E1" }}>Sin fecha</span>}</Td>
                      <Td><Badge status={a.status} /></Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </TableCard>

      {showModal && (
        <Modal title="Crear nueva actividad" onClose={()=>setShowModal(false)} accent="#B45309">
          <form onSubmit={handleSubmit}>
            <FormField label="Nombre de la actividad" required>
              <input style={inputStyle} required value={form.name}
                onChange={e=>setForm({...form,name:e.target.value})} placeholder="Ej: Examen parcial unidad 2" />
            </FormField>
            <FormField label="Descripción">
              <textarea style={{ ...inputStyle,height:70,resize:"vertical" as const }}
                value={form.description} onChange={e=>setForm({...form,description:e.target.value})}
                placeholder="Instrucciones o detalles de la actividad..." />
            </FormField>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
              <FormField label="Tipo" required>
                <select style={selectStyle} value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>
                  {Object.entries(TYPE_LABEL).map(([v,l])=><option key={v} value={v}>{l}</option>)}
                </select>
              </FormField>
              <FormField label="Estado">
                <select style={selectStyle} value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>
                  <option value="draft">Borrador</option>
                  <option value="published">Publicado</option>
                  <option value="closed">Cerrado</option>
                </select>
              </FormField>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
              <FormField label="Puntaje máximo" required>
                <input style={inputStyle} type="number" min="0" required value={form.max_score}
                  onChange={e=>setForm({...form,max_score:e.target.value})} />
              </FormField>
              <FormField label="Peso en RA (%)">
                <input style={inputStyle} type="number" min="0" max="100" value={form.weight_in_ra}
                  onChange={e=>setForm({...form,weight_in_ra:e.target.value})} placeholder="Ej: 30" />
              </FormField>
            </div>
            <FormField label="Fecha límite">
              <input style={inputStyle} type="datetime-local" value={form.due_date}
                onChange={e=>setForm({...form,due_date:e.target.value})} />
            </FormField>
            <FormField label="Asignación (sección + materia + período)" required>
              <select style={selectStyle} required value={form.subject_assignment_id}
                onChange={e=>setForm({...form,subject_assignment_id:e.target.value})}>
                <option value="">— Seleccionar asignación —</option>
                {assignments.map(a=>(
                  <option key={a.id} value={a.id}>
                    {a.subjects?.name||"?"} — Sección {a.sections?.name||"?"}{a.academic_periods?.name?` · ${a.academic_periods.name}`:""}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Resultado de aprendizaje (RA)">
              <select style={selectStyle} value={form.learning_outcome_id}
                onChange={e=>setForm({...form,learning_outcome_id:e.target.value})}>
                <option value="">— Opcional —</option>
                {outcomes.map(o=><option key={o.id} value={o.id}>[{o.code}] {o.description?.slice(0,60)}</option>)}
              </select>
            </FormField>
            {/* Checkboxes */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:18 }}>
              {[
                { field:"allows_resubmission", label:"↩ Reentrega" },
                { field:"allows_self_eval",    label:"🪞 Autoevaluación" },
                { field:"allows_peer_eval",    label:"🤝 Coevaluación" },
              ].map(({field,label})=>(
                <label key={field} style={{ display:"flex",alignItems:"center",gap:8,fontSize:13,
                  backgroundColor:"#F8FAFC",borderRadius:10,padding:"10px 12px",cursor:"pointer",
                  border:(form as any)[field]?"2px solid #B45309":"2px solid transparent" }}>
                  <input type="checkbox" checked={(form as any)[field]}
                    onChange={e=>setForm({...form,[field]:e.target.checked})}
                    style={{ width:16,height:16,accentColor:"#B45309",cursor:"pointer" }} />
                  <span style={{ fontWeight:600,color:"#374151" }}>{label}</span>
                </label>
              ))}
            </div>
            <SubmitBtn loading={saving} label="Crear actividad" color="#B45309" />
          </form>
        </Modal>
      )}
    </PageShell>
  );
}

// ─── Misc small components ───────────────────────────────────────────────────

function LoadingRow() {
  return <div style={{ padding:40, textAlign:"center", color:"#94A3B8" }}>Cargando...</div>;
}
function EmptyRow({ cols }: { cols:number }) {
  return <tr><td colSpan={cols} style={{ textAlign:"center",padding:40,color:"#94A3B8" }}>Sin resultados</td></tr>;
}
function Toast({ msg }: { msg:string }) {
  const isErr = msg.startsWith("❌");
  return (
    <div style={{ position:"fixed",top:24,right:24,zIndex:2000,
      backgroundColor:isErr?"#FEF2F2":"#F0FDF4",
      border:`1px solid ${isErr?"#FECACA":"#BBF7D0"}`,
      color:isErr?"#DC2626":"#166534",
      borderRadius:12,padding:"14px 20px",fontSize:14,fontWeight:600,
      boxShadow:"0 8px 24px rgba(0,0,0,0.12)",animation:"fadeUp .3s ease both" }}>
      {msg}
    </div>
  );
}

// ─── DASHBOARD PRINCIPAL ─────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [activeCard, setActiveCard] = useState<ActiveCard>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data:u },{ data:c },{ data:s },{ data:a }] = await Promise.all([
        supabase.from("users").select("*"),
        supabase.from("subjects").select("*"),
        supabase.from("sections").select("*"),
        supabase.from("activities").select("*"),
      ]);
      setUsers(u||[]); setCourses(c||[]); setSections(s||[]); setActivities(a||[]);
      setTimeout(()=>setLoading(false), 1000);
    })();
  }, []);

  if (activeCard==="Usuarios")    return <UsersPage onBack={()=>setActiveCard(null)} />;
  if (activeCard==="Cursos")      return <CoursesPage onBack={()=>setActiveCard(null)} />;
  if (activeCard==="Secciones")   return <SectionsPage onBack={()=>setActiveCard(null)} />;
  if (activeCard==="Actividades") return <ActivitiesPage onBack={()=>setActiveCard(null)} />;

  const statCards = [
    { name:"Usuarios" as ActiveCard,    count:users.length,      icon:"👤", gradient:"linear-gradient(135deg,#1E3A8A,#3B82F6)", desc:"Registrados en el sistema" },
    { name:"Cursos" as ActiveCard,      count:courses.length,    icon:"📚", gradient:"linear-gradient(135deg,#7C3AED,#A78BFA)", desc:"Materias activas" },
    { name:"Secciones" as ActiveCard,   count:sections.length,   icon:"🏫", gradient:"linear-gradient(135deg,#0F766E,#2DD4BF)", desc:"Grupos habilitados" },
    { name:"Actividades" as ActiveCard, count:activities.length, icon:"✅", gradient:"linear-gradient(135deg,#B45309,#FBBF24)", desc:"Tareas publicadas" },
  ];

  if (loading) {
    return (
      <div style={{ minHeight:"100vh",display:"flex",justifyContent:"center",alignItems:"center",
        flexDirection:"column",background:"linear-gradient(135deg,#1E3A8A,#3B82F6)",color:"white" }}>
        <div style={{ width:60,height:60,border:"6px solid rgba(255,255,255,0.3)",
          borderTop:"6px solid white",borderRadius:"50%",animation:"spin 1s linear infinite",marginBottom:20 }} />
        <h2 style={{ fontFamily:"Georgia,serif",letterSpacing:2 }}>Dashboard cargando...</h2>
        <style>{`@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight:"100vh",backgroundColor:"#F1F5F9",fontFamily:"'Segoe UI',Georgia,sans-serif" }}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
        .stat-card{transition:transform .25s ease,box-shadow .25s ease;}
        .stat-card:hover{transform:translateY(-6px) !important;box-shadow:0 16px 40px rgba(0,0,0,0.2) !important;cursor:pointer;}
        .rh:hover{background:#F8FAFC !important;}
      `}</style>

      {/* HEADER */}
      <div style={{ background:"linear-gradient(135deg,#1E3A8A 0%,#2563EB 60%,#3B82F6 100%)",
        padding:"40px 48px 36px",position:"relative",overflow:"hidden" }}>
        <div style={{ position:"absolute",top:-60,right:-60,width:220,height:220,borderRadius:"50%",background:"rgba(255,255,255,0.07)" }} />
        <div style={{ position:"absolute",bottom:-40,right:120,width:130,height:130,borderRadius:"50%",background:"rgba(255,255,255,0.05)" }} />
        <div style={{ position:"relative",display:"flex",justifyContent:"space-between",alignItems:"flex-end",flexWrap:"wrap",gap:16 }}>
          <div style={{ animation:"fadeUp .6s ease both" }}>
            <p style={{ color:"rgba(255,255,255,0.7)",fontSize:13,letterSpacing:3,textTransform:"uppercase" as const,marginBottom:6 }}>
              {new Date().toLocaleDateString("es-ES",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}
            </p>
            <h1 style={{ color:"white",fontSize:32,fontFamily:"Georgia,serif",fontWeight:"bold",margin:0 }}>
              {getGreeting()}, Administrador! 👋
            </h1>
            <p style={{ color:"rgba(255,255,255,0.75)",marginTop:8,fontSize:15 }}>Aquí tienes un resumen de lo que está pasando en tu plataforma.</p>
          </div>
          <div style={{ backgroundColor:"rgba(255,255,255,0.15)",backdropFilter:"blur(8px)",borderRadius:14,
            padding:"12px 20px",color:"white",fontSize:13,border:"1px solid rgba(255,255,255,0.2)" }}>
            <div style={{ fontWeight:"bold",marginBottom:2 }}>Panel Administrativo</div>
            <div style={{ opacity:.8 }}>Sistema activo ✓</div>
          </div>
        </div>
      </div>

      <div style={{ padding:"36px 48px" }}>
        <h2 style={{ color:"#1E293B",fontSize:18,fontWeight:"bold",marginBottom:20 }}>Resumen general</h2>

        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:20,marginBottom:40 }}>
          {statCards.map((card,i)=>(
            <div key={card.name} className="stat-card" onClick={()=>setActiveCard(card.name)}
              style={{ background:card.gradient,borderRadius:20,padding:"28px 24px",
                boxShadow:"0 8px 24px rgba(0,0,0,0.12)",
                animation:`fadeUp .5s ${i*.08}s ease both`,opacity:0,animationFillMode:"forwards",color:"white" }}>
              <div style={{ fontSize:36,marginBottom:12 }}>{card.icon}</div>
              <div style={{ fontSize:42,fontWeight:800,lineHeight:1,marginBottom:6 }}>{card.count}</div>
              <div style={{ fontSize:17,fontWeight:600,marginBottom:4 }}>{card.name}</div>
              <div style={{ fontSize:12,opacity:.8 }}>{card.desc}</div>
              <div style={{ marginTop:16,fontSize:12,opacity:.7 }}>Ver y gestionar →</div>
            </div>
          ))}
        </div>

        <div style={{ display:"grid",gridTemplateColumns:"1fr 1.6fr",gap:24 }}>
          <div style={{ backgroundColor:"white",borderRadius:20,padding:28,boxShadow:"0 4px 16px rgba(0,0,0,0.07)" }}>
            <h3 style={{ color:"#1E293B",fontSize:16,fontWeight:"bold",marginBottom:20 }}>Actividad reciente</h3>
            {[
              { label:"Usuarios activos hoy",  val:Math.max(1,Math.floor(users.length*.6)),     icon:"🟢" },
              { label:"Cursos completados",     val:Math.max(0,Math.floor(courses.length*.4)),   icon:"🎓" },
              { label:"Actividades pendientes", val:Math.max(0,Math.floor(activities.length*.3)),icon:"⏳" },
              { label:"Secciones sin docente",  val:Math.max(0,Math.floor(sections.length*.15)), icon:"⚠️" },
            ].map(item=>(
              <div key={item.label} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:"1px solid #F1F5F9" }}>
                <span style={{ color:"#475569",fontSize:14 }}>{item.icon} {item.label}</span>
                <span style={{ fontWeight:700,color:"#1E3A8A",fontSize:16 }}>{item.val}</span>
              </div>
            ))}
          </div>

          <div style={{ backgroundColor:"white",borderRadius:20,padding:28,boxShadow:"0 4px 16px rgba(0,0,0,0.07)" }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
              <h3 style={{ color:"#1E293B",fontSize:16,fontWeight:"bold" }}>Reportes de Profesores</h3>
              <span style={{ backgroundColor:"#FEF2F2",color:"#DC2626",borderRadius:20,padding:"4px 12px",fontSize:12,fontWeight:600 }}>
                {FAKE_COMPLAINTS.filter(c=>c.status==="pendiente").length} pendientes
              </span>
            </div>
            <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
              {FAKE_COMPLAINTS.map(c=>(
                <div key={c.id} className="rh" style={{ display:"flex",gap:14,padding:14,borderRadius:14,background:"#FAFAFA",border:"1px solid #F1F5F9",cursor:"pointer" }}>
                  <div style={{ width:42,height:42,borderRadius:"50%",background:c.color,color:"white",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:"bold",fontSize:17,flexShrink:0 }}>{c.avatar}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4 }}>
                      <span style={{ fontWeight:700,color:"#1E293B",fontSize:13 }}>{c.teacher} <span style={{ color:"#94A3B8",fontWeight:400 }}>· {c.subject}</span></span>
                      <Badge status={c.status} />
                    </div>
                    <p style={{ color:"#64748B",fontSize:13,margin:"0 0 6px",lineHeight:1.5 }}>{c.message}</p>
                    <span style={{ color:"#94A3B8",fontSize:11 }}>{c.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}