import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function GET() {
  return NextResponse.json({
    success: false,
    disabled: true,
    message: "RAG / embeddings are temporarily disabled (billing not set up yet).",
  })
}

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      disabled: true,
      message: "RAG / embeddings are temporarily disabled (billing not set up yet).",
    },
    { status: 503 }
  )
}
