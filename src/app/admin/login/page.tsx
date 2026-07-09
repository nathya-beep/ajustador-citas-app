"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { brand } from "@/lib/brand";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        router.push("/admin");
      } else {
        setError("Credenciales inválidas");
      }
    } catch {
      setError("No se pudo conectar. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-bg">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="logo">
          <span className="badge">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></svg>
          </span> {brand.name}
        </div>
        <p className="login-sub">Panel del ajustador</p>

        <div className="field">
          <label>Correo</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tucorreo@ejemplo.com" autoComplete="username" />
        </div>
        <div className="field">
          <label>Contraseña</label>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
        </div>

        <button type="submit" className="btn btn-ink btn-block" disabled={loading}>
          {loading ? "Entrando…" : "Entrar al panel"}
        </button>
        {error && <p className="alert-err" role="alert" style={{ marginTop: 12, textAlign: "center" }}>{error}</p>}

        <p className="login-hint"><Link href="/es">← Volver al sitio</Link></p>
      </form>
    </div>
  );
}
