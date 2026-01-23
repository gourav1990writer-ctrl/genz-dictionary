"use client"

import { useEffect, useState } from "react"
import { supabaseBrowser } from "@/lib/supabaseBrowser"

type Role = "en_student" | "fr_student" | "admin" | null
type Lang = "en" | "fr"

export default function SubmitPage() {
  const supabase = supabaseBrowser()

  const [userId, setUserId] = useState<string | null>(null)
  const [role, setRole] = useState<Role>(null)
  const [language, setLanguage] = useState<Lang>("en")
  const [msg, setMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [word, setWord] = useState("")
  const [definition, setDefinition] = useState("")
  const [example, setExample] = useState("")
  const [tags, setTags] = useState("")

  useEffect(() => {
    ;(async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) {
        window.location.href = "/login"
        return
      }
      setUserId(data.user.id)

      const { data: p, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single()

      if (!error) {
        const r = (p?.role ?? null) as Role
        setRole(r)
        setLanguage(r === "fr_student" ? "fr" : "en")
      }
    })()
  }, [])

  const submit = async () => {
    setMsg(null)
    setLoading(true)
    try {
      if (!userId) return
      if (!word.trim() || !definition.trim()) {
        setMsg("Word and definition are required.")
        return
      }

      const tagsArray = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)

      const { error } = await supabase.from("entries").insert({
        word: word.trim(),
        definition: definition.trim(),
        example: example.trim() || null,
        language,
        tags: tagsArray,
        status: "pending",
        created_by: userId,
      })

      if (error) {
        // duplicate word message help
        if (String(error.message).toLowerCase().includes("duplicate")) {
          setMsg("That word already exists in this language.")
          return
        }
        throw error
      }

      setWord("")
      setDefinition("")
      setExample("")
      setTags("")
      setMsg("Submitted! It will appear after admin approval.")
    } catch (e: any) {
      setMsg(e.message ?? "Submission failed.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ padding: 24, fontFamily: "sans-serif", maxWidth: 720 }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>Submit a word</h1>

      <p style={{ marginBottom: 16 }}>
        Your language is set automatically:{" "}
        <b>{language === "fr" ? "French" : "English"}</b>
        {role ? ` (role: ${role})` : ""}
      </p>

      <label>Word</label>
      <input
        value={word}
        onChange={(e) => setWord(e.target.value)}
        style={{ width: "100%", padding: 10, borderRadius: 8, marginBottom: 12 }}
      />

      <label>Definition</label>
      <textarea
        value={definition}
        onChange={(e) => setDefinition(e.target.value)}
        style={{ width: "100%", padding: 10, borderRadius: 8, marginBottom: 12 }}
      />

      <label>Example (optional)</label>
      <textarea
        value={example}
        onChange={(e) => setExample(e.target.value)}
        style={{ width: "100%", padding: 10, borderRadius: 8, marginBottom: 12 }}
      />

      <label>Tags (comma separated, optional)</label>
      <input
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        placeholder="slang, tiktok, school"
        style={{ width: "100%", padding: 10, borderRadius: 8, marginBottom: 12 }}
      />

      <button onClick={submit} disabled={loading} style={{ padding: "10px 14px", borderRadius: 10 }}>
        {loading ? "Submitting..." : "Submit"}
      </button>

      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}

      <p style={{ marginTop: 16 }}>
        <a href="/">Home</a> • <a href="/admin">Admin</a> • <a href="/login">Login</a>
      </p>
    </main>
  )
}
