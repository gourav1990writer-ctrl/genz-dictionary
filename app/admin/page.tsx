"use client"

import { useEffect, useState } from "react"
import { supabaseBrowser } from "@/lib/supabaseBrowser"

type Entry = {
  id: string
  word: string
  definition: string
  example: string | null
  language: "en" | "fr"
  tags: string[]
  status: "pending" | "approved" | "rejected"
  rejection_reason?: string | null
  created_at: string
}

export default function AdminPage() {
  const supabase = supabaseBrowser()
  const [msg, setMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [entries, setEntries] = useState<Entry[]>([])
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected">("pending")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Partial<Entry>>({})
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({})

  const load = async () => {
    setMsg(null)
    setLoading(true)
    try {
      const { data: userData } = await supabase.auth.getUser()
      const user = userData.user
      if (!user) {
        window.location.href = "/login"
        return
      }

      const { data: profile, error: pErr } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single()

      if (pErr) throw pErr

      if (!profile?.is_admin) {
        setIsAdmin(false)
        setEntries([])
        setMsg("You are logged in, but not admin.")
        return
      }

      setIsAdmin(true)

const { data: rows, error: entriesError } = await supabase
  .from("entries")
  .select("id,word,definition,example,language,tags,status,created_at,rejection_reason")
  .eq("status", filter)
  .order("created_at", { ascending: true })

if (entriesError) throw entriesError
setEntries((rows ?? []) as Entry[])

    } catch (e: any) {
      setMsg(e.message ?? "Failed to load admin panel.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
  load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [filter])


  const startEdit = (e: Entry) => {
    setEditingId(e.id)
    setDraft({
      word: e.word,
      definition: e.definition,
      example: e.example ?? "",
      tags: e.tags ?? [],
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setDraft({})
  }

  const saveEdit = async (id: string) => {
    setMsg(null)
    try {
      const tagsArray =
        typeof (draft as any).tags === "string"
          ? (draft as any).tags
              .split(",")
              .map((t: string) => t.trim())
              .filter(Boolean)
          : (draft.tags ?? [])

      const payload: any = {
        word: (draft.word ?? "").trim(),
        definition: (draft.definition ?? "").trim(),
        example: (draft.example ?? "").trim() || null,
        tags: tagsArray,
      }

      const { error } = await supabase.from("entries").update(payload).eq("id", id)
      if (error) throw error

      setEntries((prev) =>
        prev.map((x) => (x.id === id ? { ...x, ...payload } : x))
      )
      setMsg("Saved edits.")
      setEditingId(null)
      setDraft({})
    } catch (e: any) {
      setMsg(e.message ?? "Save failed.")
    }
  }

  const setStatus = async (id: string, status: "approved" | "rejected") => {
    setMsg(null)
    try {
      const update: any = { status }

      if (status === "approved") {
        update.approved_at = new Date().toISOString()
        update.rejection_reason = null
      }

      if (status === "rejected") {
        update.rejection_reason = rejectReason[id]?.trim() || null
      }

      const { error } = await supabase.from("entries").update(update).eq("id", id)
      if (error) throw error

      setEntries((prev) => prev.filter((e) => e.id !== id))
      setMsg(`Entry ${status}.`)
    } catch (e: any) {
      setMsg(e.message ?? "Update failed.")
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    window.location.href = "/"
  }

  return (
    <main style={{ padding: 24, fontFamily: "sans-serif", maxWidth: 980 }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>Admin approvals</h1>
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
  <label>Show:</label>
  <select
    value={filter}
    onChange={(e) => setFilter(e.target.value as any)}
    style={{ padding: 8, borderRadius: 8 }}
  >
    <option value="pending">Pending</option>
    <option value="approved">Approved</option>
    <option value="rejected">Rejected</option>
  </select>
</div>


      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <a href="/">Home</a>
        <a href="/submit">Submit</a>
        <a href="/login">Login</a>
        <button onClick={signOut}>Sign out</button>
        <button onClick={load}>Refresh</button>
      </div>

      {loading && <p>Loading…</p>}
      {msg && <p>{msg}</p>}

      {!loading && isAdmin && (
        <>
          <h2 style={{ marginTop: 18 }}>Pending entries: {entries.length}</h2>

          {entries.length === 0 ? (
            <p>No pending entries.</p>
          ) : (
            <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
              {entries.map((e) => {
                const isEditing = editingId === e.id
                return (
                  <div
                    key={e.id}
                    style={{
                      border: "1px solid #444",
                      borderRadius: 12,
                      padding: 12,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 18 }}>
                          <b>{e.word}</b>{" "}
                          <span style={{ opacity: 0.8 }}>({e.language})</span>
                        </div>

                        {!isEditing ? (
                          <>
                            <div style={{ marginTop: 6 }}>{e.definition}</div>
                            {e.example && (
                              <div style={{ marginTop: 6, opacity: 0.9 }}>
                                Example: {e.example}
                              </div>
                            )}
                            {e.tags?.length > 0 && (
                              <div style={{ marginTop: 8, opacity: 0.8 }}>
                                Tags: {e.tags.join(", ")}
                              </div>
                            )}
                          </>
                        ) : (
                          <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                            <input
                              value={draft.word ?? ""}
                              onChange={(ev) => setDraft((d) => ({ ...d, word: ev.target.value }))}
                              placeholder="Word"
                              style={{ padding: 8, borderRadius: 8 }}
                            />
                            <textarea
                              value={draft.definition ?? ""}
                              onChange={(ev) =>
                                setDraft((d) => ({ ...d, definition: ev.target.value }))
                              }
                              placeholder="Definition"
                              style={{ padding: 8, borderRadius: 8 }}
                            />
                            <textarea
                              value={(draft.example as any) ?? ""}
                              onChange={(ev) =>
                                setDraft((d) => ({ ...d, example: ev.target.value }))
                              }
                              placeholder="Example"
                              style={{ padding: 8, borderRadius: 8 }}
                            />
                            <input
                              value={
                                Array.isArray(draft.tags)
                                  ? draft.tags.join(", ")
                                  : ((draft as any).tags ?? "")
                              }
                              onChange={(ev) => setDraft((d) => ({ ...d, tags: ev.target.value as any }))}
                              placeholder="Tags (comma separated)"
                              style={{ padding: 8, borderRadius: 8 }}
                            />
                            <div style={{ display: "flex", gap: 10 }}>
                              <button onClick={() => saveEdit(e.id)}>Save</button>
                              <button onClick={cancelEdit}>Cancel</button>
                            </div>
                          </div>
                        )}
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 190 }}>
                        {!isEditing && (
                          <button onClick={() => startEdit(e)}>Edit</button>
                        )}

                        <button onClick={() => setStatus(e.id, "approved")}>Approve</button>

                        <textarea
                          value={rejectReason[e.id] ?? ""}
                          onChange={(ev) =>
                            setRejectReason((r) => ({ ...r, [e.id]: ev.target.value }))
                          }
                          placeholder="Reason for rejection (optional)"
                          style={{ padding: 8, borderRadius: 8 }}
                        />
                        <button onClick={() => setStatus(e.id, "rejected")}>Reject</button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </main>
  )
}
