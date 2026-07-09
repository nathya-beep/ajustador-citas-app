"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    try {
      await fetch("/api/admin/login", { method: "DELETE" });
      router.push("/admin/login");
      router.refresh();
    } catch {
      setLoading(false);
    }
  }

  return (
    <button className="btn btn-ghost btn-sm" onClick={logout} disabled={loading}>
      {loading ? "Saliendo…" : "Salir"}
    </button>
  );
}
