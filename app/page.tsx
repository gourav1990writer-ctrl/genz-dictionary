"use client"

import { useEffect, useMemo, useState } from "react"
import { supabaseBrowser } from "@/lib/supabaseBrowser"

type Entry = {
  id: string
  word: string
  definition: string
  example: string | null
  language: "en" | "fr"
  tags: string[]
  vote_score: number
  vote_count: number
  created_at: string
}

export default function HomePage() {
  const supabase = supabaseBrowser()

  const [entries, setEntries] = useState<Entry[]>([])
  const [q, setQ] = useState("")
  const [lang, setLang] = useState<"all" | "en" | "fr">("all")
  const [sort, setSort] = useState<"popular" | "az" | "newest">("popular")
  const [userEmail, setUserEmail] = useState<string | null>(null)

  // Track the current user's votes so we can toggle (1, -1, or null)
  const [myVotes, setMyVotes] = useState<Record<string, 1 | -1>>({})

  const loadEntries = async () => {
    let query = supabase
      .from("approved_entries_with_votes")
      .select("id,word,definition,example,language,tags,vote_score,vote_count,created_at")

    if (sort === "popular") {
      query = query
        .order("vote_score", { ascending: false })
        .order("word", { ascending: true })
    } else if (sort === "az") {
      query = query.order("word", { ascending: true })
    } else {
      query = query.order("created_at", { ascending: false })
    }

    const { data: rows, error } = await query
    if (!error) setEntries((rows ?? []) as Entry[])
  }

  const loadMyVotes = async () => {
    const { data } = await supabase.auth.getUser()
    if (!data.user) {
      setMyVotes({})
      return
    }

    const { data: rows, error } = await supabase
      .from("votes")
      .select("entry_id,value")
      .eq("user_id", data.user.id)

    if (error) return

    const map: Record<string, 1 | -1> = {}
    ;(rows ?? []).forEach((r: any) => {
      map[r.entry_id] = r.value
    })
    setMyVotes(map)
  }

  const vote = async (entryId: string, clickedValue: 1 | -1) => {
    const { data } = await supabase.auth.getUser()
    if (!data.user) {
      alert("Please log in to vote.")
      return
    }

    const current = myVotes[entryId] ?? null

    // If user clicks the same vote again -> remove vote (delete row)
    if (current === clickedValue) {
      const { error } = await supabase
        .from("votes")
        .delete()
        .eq("entry_id", entryId)
        .eq("user_id", data.user.id)

      if (error) {
        alert(error.message)
        return
      }

      // Update local state immediately
      setMyVotes((prev) => {
        const copy = { ...prev }
        delete copy[entryId]
        return copy
      })

      await loadEntries()
      return
    }

    // Otherwise insert/update vote (switch vote or first-time vote)
    const { error } = await supabase
      .from("votes")
      .upsert(
        {
          entry_id: entryId,
          user_id: data.user.id,
          value: clickedValue,
        },
        { onConflict: "entry_id,user_id" }
      )

    if (error) {
      alert(error.message)
      return
    }

    // Update local state immediately
    setMyVotes((prev) => ({ ...prev, [entryId]: clickedValue }))

    await loadEntries()
  }

  useEffect(() => {
    ;(async () => {
      const { data } = await supabase.auth.getUser()
      setUserEmail(data.user?.email ?? null)
      await loadEntries()
      await loadMyVotes()
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort])

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    return entries.filter((e) => {
      if (lang !== "all" && e.language !== lang) return false
      if (!s) return true
      return (
        e.word.toLowerCase().includes(s) ||
        e.definition.toLowerCase().includes(s) ||
        (e.tags ?? []).join(",").toLowerCase().includes(s)
      )
    })
  }, [entries, q, lang])

  return (
    <main style={{ padding: 24, fontFamily: "sans-serif", maxWidth: 900 }}>
      <h1 style={{ fontSize: 32, marginBottom: 6 }}>Gen Z / Alpha Dictionary</h1>

      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <a href="/submit">Submit</a>
        <a href="/my-submissions">My submissions</a>
        <a href="/admin">Admin</a>
        <a href="/login">{userEmail ? `Logged in: ${userEmail}` : "Login"}</a>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search word / meaning / tags..."
          style={{ padding: 10, borderRadius: 10, minWidth: 260 }}
        />

        <select
          value={lang}
          onChange={(e) => setLang(e.target.value as any)}
          style={{ padding: 10, borderRadius: 10 }}
        >
          <option value="all">All</option>
          <option value="en">English</option>
          <option value="fr">French</option>
        </select>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as any)}
          style={{ padding: 10, borderRadius: 10 }}
        >
          <option value="popular">Popular</option>
          <option value="az">A–Z</option>
          <option value="newest">Newest</option>
        </select>
      </div>

      <p style={{ opacity: 0.85, marginBottom: 10 }}>Approved entries: {filtered.length}</p>

      <div style={{ display: "grid", gap: 12 }}>
        {filtered.map((e) => {
          const mine = myVotes[e.id] ?? null

          return (
            <div
              key={e.id}
              style={{
                border: "1px solid #444",
                borderRadius: 12,
                padding: 12,
              }}
            >
              <div style={{ fontSize: 18 }}>
                <b>{e.word}</b>{" "}
                <span style={{ opacity: 0.8 }}>({e.language})</span>
              </div>

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

              <div style={{ marginTop: 8, opacity: 0.85 }}>
                Score: <b>{e.vote_score}</b> · Votes: {e.vote_count}
                {mine && (
                  <span style={{ marginLeft: 10 }}>
                    Your vote: <b>{mine === 1 ? "👍" : "👎"}</b>
                  </span>
                )}
              </div>

              <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
                <button
                  onClick={() => vote(e.id, 1)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 10,
                    opacity: mine === 1 ? 1 : 0.85,
                    fontWeight: mine === 1 ? 700 : 400,
                  }}
                >
                  👍 Upvote
                </button>

                <button
                  onClick={() => vote(e.id, -1)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 10,
                    opacity: mine === -1 ? 1 : 0.85,
                    fontWeight: mine === -1 ? 700 : 400,
                  }}
                >
                  👎 Downvote
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </main>
  )
}
