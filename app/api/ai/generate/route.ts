import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  prompt: z.string().min(1, "Prompt is required").max(2000, "Prompt too long"),
  systemInstruction: z.string().optional(),
});

export async function POST(req: Request) {
    // Basic rate limit/security check
    if (!req.headers.get("User-Agent")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const result = schema.safeParse(body);
        if (!result.success) return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
        
        const { prompt, systemInstruction } = result.data;

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
        const res = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: prompt,
            config: {
                systemInstruction: systemInstruction
            }
        });

        const text = res.text;

        return NextResponse.json({ text });
    } catch (error) {
        console.error("AI Error:", error);
        return NextResponse.json({ error: "AI generation failed" }, { status: 500 });
    }
}
