import { NextRequest, NextResponse } from "next/server";
import { getOpenAIClient } from "@/lib/openai";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const word: string = body.word;

  if (!word) {
    return NextResponse.json({ error: "word is required" }, { status: 400 });
  }

  const openai = getOpenAIClient();

  const response = await openai.audio.speech.create({
    model: "tts-1",
    voice: "alloy",
    input: word,
    response_format: "mp3",
  });

  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");

  return NextResponse.json({ audio: base64 });
}
