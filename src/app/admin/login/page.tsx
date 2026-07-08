"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
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
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>Admin Login</h1>
      <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
      <input
        type="password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button type="submit">Entrar</button>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}
