"use client"

import { useEffect, useState } from "react"
import { supabaseBrowser } from "@/lib/supabaseBrowser"

type MyEntry = {
  id: string
  word: string
  language: "en" | "fr"
  status: "pending" | "approved" | "rejected"
  rejection_reason: string | null
  created_at: string
}

export default function MySubmissionsPage() {
  const supabase = supabaseBrowser()
  const [rows, setRows] = useState<MyEntry[]>([])
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) {
        window.location.href = "/login"
        return
      }

      const { data: entries, error } = await supabase
        .from("entries")
        .select("id,word,language,status,rejection_reason,created_at")
        .eq("created_by", data.user.id)
        .order("created_at", { ascending: false })

      if (error) {
        setMsg(error.message)
        return
      }

      setRows((entries ?? []) as MyEntry[])
    })()
  }, [])

  return (
    <main style={{ padding: 24, fontFamily: "sans-serif", maxWidth: 900 }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>My submissions</h1>

      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <a href="/">Home</a>
        <a href="/submit">Submit</a>
        <a href="/admin">Admin</a>
      </div>

      {msg && <p>{msg}</p>}

      {rows.length === 0 ? (
        <p>You haven’t submitted anything yet.</p>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {rows.map((e) => (
            <div
              key={e.id}
              style={{ border: "1px solid #444", borderRadius: 12, padding: 12 }}
            >
              <div style={{ fontSize: 18 }}>
                <b>{e.word}</b> <span style={{ opacity: 0.8 }}>({e.language})</span>
              </div>

              <div style={{ marginTop: 8 }}>
                Status:{" "}
                <b>
                  {e.status === "pending"
                    ? "Pending approval"
                    : e.status === "approved"
                    ? "Approved ✅"
                    : "Rejected ❌"}
                </b>
              </div>

              {e.status === "rejected" && e.rejection_reason && (
                <div style={{ marginTop: 8, opacity: 0.9 }}>
                  Reason: {e.rejection_reason}
                </div>
              )}

              <div style={{ marginTop: 8, opacity: 0.8 }}>
                Submitted: {new Date(e.created_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
