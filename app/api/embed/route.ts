import { NextResponse } from "next/server"
import OpenAI from "openai"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST() {
    if (process.env.RAG_ENABLED !== "true") {
    return NextResponse.json(
      { disabled: true, msg: "RAG is disabled until billing is enabled." },
      { status: 200 }
    )
  }
  try {
    // 1) Get approved entries that do NOT have embeddings yet
    const { data: entries, error } = await supabase
      .from("entries")
      .select("id, word, definition, example, tags, language")
      .eq("status", "approved")
      .is("embedding", null)
      .limit(200)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!entries || entries.length === 0) {
      return NextResponse.json({
        success: true,
        updated: 0,
        msg: "No approved entries missing embeddings.",
      })
    }

    // 2) Create embeddings + store them
    let updated = 0

    for (const e of entries) {
      const text = [
        `Word: ${e.word}`,
        `Language: ${e.language}`,
        `Definition: ${e.definition}`,
        `Example: ${e.example ?? ""}`,
        `Tags: ${(e.tags ?? []).join(", ")}`,
      ].join("\n")

      const emb = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
      })

      const vector = emb.data[0].embedding

      const { error: uErr } = await supabase
        .from("entries")
        .update({ embedding: vector })
        .eq("id", e.id)

      if (uErr) {
        return NextResponse.json({ error: uErr.message }, { status: 500 })
      }

      updated++
    }

    return NextResponse.json({ success: true, updated })
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Embed route failed." },
      { status: 500 }
    )
  }
}
