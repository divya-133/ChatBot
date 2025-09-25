import { NextResponse } from "next/server";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }

    // Convert Web File → Node Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let text = "";

    if (file.name.toLowerCase().endsWith(".pdf")) {
      const pdfData = await pdfParse(buffer);
      text = pdfData.text || "";
    } else if (file.name.toLowerCase().endsWith(".docx") || file.name.toLowerCase().endsWith(".doc")) {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value || "";
    } else {
      // Plain text fallback
      text = buffer.toString("utf-8");
    }

    if (!text) {
      return NextResponse.json({ success: false, error: "Could not extract text" }, { status: 422 });
    }

    // Limit large files
    const MAX = 120_000;
    if (text.length > MAX) {
      text = text.slice(0, MAX) + "\n\n[TRUNCATED]";
    }

    return NextResponse.json({
      success: true,
      name: file.name,
      text,
    });
  } catch (err) {
    console.error("extract error:", err);
    return NextResponse.json({ success: false, error: "Extraction failed" }, { status: 500 });
  }
}
