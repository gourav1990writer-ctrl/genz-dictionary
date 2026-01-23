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
  }, [])

  const handle = async () => {
    setMsg(null)
    setLoading(true)
    try {
      if (!email || !password) {
        setMsg("Please enter email and password.")
        return
      }

      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error

        // If Supabase email confirmation is ON, user may not be fully logged in yet.
        // Still, profile row will exist via trigger once user is created.
        // When they sign in, we’ll store role too.
        if (data.user?.id) {
          await supabase
            .from("profiles")
            .update({ role })
            .eq("id", data.user.id)
        }

        setMsg(
          "Account created. If email confirmation is ON, check inbox, then sign in. (Role saved.)"
        )
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error

        // Ensure role is set if missing (helps if email confirmation delayed profile updates)
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
    <main style={{ padding: 24, fontFamily: "sans-serif", maxWidth: 560 }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>Login</h1>

      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <a href="/">Home</a>
        <a href="/submit">Submit</a>
        <a href="/admin">Admin</a>
        {who ? (
          <button onClick={signOut} style={{ padding: "6px 10px" }}>
            Sign out ({who})
          </button>
        ) : null}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button
          onClick={() => setMode("signin")}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid #444",
            background: mode === "signin" ? "#222" : "transparent",
            color: "white",
            cursor: "pointer",
          }}
        >
          Sign in
        </button>
        <button
          onClick={() => setMode("signup")}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid #444",
            background: mode === "signup" ? "#222" : "transparent",
            color: "white",
            cursor: "pointer",
          }}
        >
          Sign up
        </button>
      </div>

      {mode === "signup" && (
        <>
          <label>Are you a…</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            style={{ width: "100%", padding: 10, borderRadius: 8, marginBottom: 12 }}
          >
            <option value="en_student">English student (adds English words)</option>
            <option value="fr_student">French student (adds French words)</option>
          </select>
        </>
      )}

      <label>Email</label>
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        style={{
          width: "100%",
          padding: 10,
          borderRadius: 8,
          border: "1px solid #444",
          marginBottom: 12,
          background: "transparent",
          color: "white",
        }}
      />

      <label>Password</label>
      <input
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        type="password"
        placeholder="••••••••"
        style={{
          width: "100%",
          padding: 10,
          borderRadius: 8,
          border: "1px solid #444",
          marginBottom: 12,
          background: "transparent",
          color: "white",
        }}
      />

      <button
        onClick={handle}
        disabled={loading}
        style={{
          padding: "10px 14px",
          borderRadius: 10,
          border: "1px solid #444",
          background: "#111",
          color: "white",
          cursor: "pointer",
          width: "100%",
        }}
      >
        {loading ? "Please wait..." : mode === "signup" ? "Create account" : "Sign in"}
      </button>

      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}
    </main>
  )
}
