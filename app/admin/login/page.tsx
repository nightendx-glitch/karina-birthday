"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    setError("");
    setLoading(true);

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error(error);

      setError("Неверная почта или пароль.");
      setLoading(false);

      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#4b101f",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        color: "white",
      }}
    >
      <form
        onSubmit={handleLogin}
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "rgba(255,255,255,0.08)",
          padding: "40px 30px",
          borderRadius: "24px",
          backdropFilter: "blur(15px)",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            fontSize: "13px",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            opacity: 0.7,
            marginBottom: "15px",
          }}
        >
          Birthday evening
        </div>

        <h1
          style={{
            fontSize: "36px",
            margin: "0 0 10px",
          }}
        >
          Админ-панель
        </h1>

        <p
          style={{
            opacity: 0.75,
            marginBottom: "35px",
          }}
        >
          Войдите, чтобы посмотреть ответы гостей.
        </p>

        <label
          style={{
            display: "block",
            marginBottom: "8px",
          }}
        >
          Email
        </label>

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@email.com"
          required
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "15px",
            borderRadius: "12px",
            border: "none",
            marginBottom: "20px",
            fontSize: "16px",
          }}
        />

        <label
          style={{
            display: "block",
            marginBottom: "8px",
          }}
        >
          Пароль
        </label>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "15px",
            borderRadius: "12px",
            border: "none",
            marginBottom: "20px",
            fontSize: "16px",
          }}
        />

        {error && (
          <div
            style={{
              background: "rgba(255,0,0,0.15)",
              padding: "12px",
              borderRadius: "10px",
              marginBottom: "20px",
              fontSize: "14px",
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: "12px",
            border: "none",
            background: "white",
            color: "#4b101f",
            fontSize: "15px",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          {loading ? "Входим..." : "Войти"}
        </button>
      </form>
    </main>
  );
}