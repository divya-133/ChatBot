// src/app/api/chat/route.ts

import { NextResponse } from "next/server";
import OpenAI from "openai";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI API key missing. Set OPENAI_API_KEY in .env.local" },
        { status: 500 }
      );
    }

    const client = new OpenAI({ apiKey });

    const body = await req.json();
    const { messages = [], fileContext, includeResources = false } = body;

    const systemInit = [
      {
        role: "system",
        content: "You are a helpful AI assistant. Reply in plain text. Be concise and accurate.",
      },
    ];

    if (fileContext) {
      systemInit.push({
        role: "system",
        content: "Reference the following document if relevant:\n\n" + fileContext,
      });
    }

    if (includeResources) {
      systemInit.push({
        role: "system",
        content: "When providing solutions, include 1-3 free resources (tutorials, docs, GitHub) if applicable.",
      });
    }

    // Create streaming completion
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [...systemInit, ...messages],
      stream: true,
    });

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of completion) {
            const delta = chunk.choices?.[0]?.delta;
            if (!delta) continue;

            // Only send text, never objects
            if (typeof delta.content === "string") {
              controller.enqueue(encoder.encode(delta.content));
            }
          }
        } catch (err) {
          console.error("Stream error:", err);
        } finally {
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (err) {
    console.error("Chat route error:", err);
    return NextResponse.json({ error: "Chat processing failed" }, { status: 500 });
  }
}

