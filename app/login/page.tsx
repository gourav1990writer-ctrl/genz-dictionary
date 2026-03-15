"use client"

import { useEffect, useState } from "react"
import { supabaseBrowser } from "@/lib/supabaseBrowser"

type Role = "en_student" | "fr_student"

export default function LoginPage() {
  const supabase = supabaseBrowser()

  const [mode, setMode] = useState<"signin" | "signup">("signin")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<Role>("en_student")
  const [msg, setMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [who, setWho] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      const { data } = await supabase.auth.getUser()
      setWho(data.user?.email ?? null)
    })()
  }, [supabase])

  const handle = async () => {
    setMsg(null)
    setLoading(true)

    try {
      if (!email || !password) {
        setMsg("Please enter email and password.")
        return
      }

      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })

        if (error) throw error

        if (data.user?.id) {
          await supabase.from("profiles").update({ role }).eq("id", data.user.id)
        }

        setMsg(
          "Account created. If email confirmation is enabled, please check your inbox, confirm your email, and then sign in."
        )
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error

        if (data.user?.id) {
          const { data: p } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", data.user.id)
            .single()

          if (!p?.role) {
            await supabase.from("profiles").update({ role }).eq("id", data.user.id)
          }
        }

        window.location.href = "/"
      }
    } catch (e: any) {
      setMsg(e.message ?? "Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    window.location.href = "/"
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f7fb",
        padding: "32px 16px",
        fontFamily: "Arial, sans-serif",
        color: "#111827",
      }}
    >
      <div
        style={{
          maxWidth: 560,
          margin: "0 auto",
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: 16,
          padding: 24,
          boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
        }}
      >
        <h1
          style={{
            fontSize: 30,
            fontWeight: 700,
            marginBottom: 8,
            color: "#111827",
          }}
        >
          Login
        </h1>

        <p style={{ marginTop: 0, marginBottom: 18, color: "#4b5563" }}>
          Sign in to your Gen-Z Dictionary account or create a new one.
        </p>

        <div
          style={{
            display: "flex",
            gap: 12,
            marginBottom: 18,
            flexWrap: "wrap",
            fontSize: 14,
          }}
        >
          <a href="/" style={{ color: "#2563eb", textDecoration: "none" }}>
            Home
          </a>
          <a href="/submit" style={{ color: "#2563eb", textDecoration: "none" }}>
            Submit
          </a>
          <a href="/admin" style={{ color: "#2563eb", textDecoration: "none" }}>
            Admin
          </a>

          {who ? (
            <button
              onClick={signOut}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                background: "#ffffff",
                color: "#111827",
                cursor: "pointer",
              }}
            >
              Sign out ({who})
            </button>
          ) : null}
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <button
            onClick={() => setMode("signin")}
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: 10,
              border: mode === "signin" ? "1px solid #111827" : "1px solid #d1d5db",
              background: mode === "signin" ? "#111827" : "#f9fafb",
              color: mode === "signin" ? "#ffffff" : "#111827",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Sign in
          </button>

          <button
            onClick={() => setMode("signup")}
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: 10,
              border: mode === "signup" ? "1px solid #111827" : "1px solid #d1d5db",
              background: mode === "signup" ? "#111827" : "#f9fafb",
              color: mode === "signup" ? "#ffffff" : "#111827",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Sign up
          </button>
        </div>

        {mode === "signup" && (
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: "block",
                marginBottom: 8,
                fontWeight: 600,
                color: "#111827",
              }}
            >
              Are you a…
            </label>

            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 10,
                border: "1px solid #d1d5db",
                background: "#ffffff",
                color: "#111827",
                fontSize: 15,
              }}
            >
              <option value="en_student">English student (adds English words)</option>
              <option value="fr_student">French student (adds French words)</option>
            </select>
          </div>
        )}

        <div style={{ marginBottom: 14 }}>
          <label
            style={{
              display: "block",
              marginBottom: 8,
              fontWeight: 600,
              color: "#111827",
            }}
          >
            Email
          </label>

          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            type="email"
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 10,
              border: "1px solid #d1d5db",
              background: "#ffffff",
              color: "#111827",
              fontSize: 15,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              display: "block",
              marginBottom: 8,
              fontWeight: 600,
              color: "#111827",
            }}
          >
            Password
          </label>

          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="••••••••"
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 10,
              border: "1px solid #d1d5db",
              background: "#ffffff",
              color: "#111827",
              fontSize: 15,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        <button
          onClick={handle}
          disabled={loading}
          style={{
            padding: "12px 14px",
            borderRadius: 10,
            border: "none",
            background: loading ? "#9ca3af" : "#2563eb",
            color: "#ffffff",
            cursor: loading ? "not-allowed" : "pointer",
            width: "100%",
            fontWeight: 700,
            fontSize: 15,
          }}
        >
          {loading ? "Please wait..." : mode === "signup" ? "Create account" : "Sign in"}
        </button>

        {msg && (
          <p
            style={{
              marginTop: 14,
              padding: 12,
              borderRadius: 10,
              background: "#f3f4f6",
              color: "#111827",
              fontSize: 14,
              lineHeight: 1.5,
            }}
          >
            {msg}
          </p>
        )}
      </div>
    </main>
  )
}