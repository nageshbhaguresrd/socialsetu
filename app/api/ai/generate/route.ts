import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  prompt: z.string().min(1, "Prompt is required").max(2000, "Prompt too long"),
  systemInstruction: z.string().max(500, "System instruction too long").optional(),
});

export async function POST(req: Request) {
    // Require authentication (prevents unauthenticated prompt abuse)
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }



    try {
        const body = await req.json();
        const result = schema.safeParse(body);
        if (!result.success) return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
        
        const { prompt, systemInstruction } = result.data;

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
        
        let text = '';
        try {
            const res = await ai.models.generateContent({
                model: "gemini-3.8-flash",
                contents: prompt,
                config: {
                    systemInstruction: systemInstruction
                }
            });
            text = res.text || '';
        } catch (modelErr) {
            console.warn("Primary model gemini-3.8-flash failed, falling back to gemini-flash-latest:", modelErr);
            const fallbackRes = await ai.models.generateContent({
                model: "gemini-flash-latest",
                contents: prompt,
                config: {
                    systemInstruction: systemInstruction
                }
            });
            text = fallbackRes.text || '';
        }

        return NextResponse.json({ text });
    } catch (error: any) {
        console.error("AI Error:", error);
        return NextResponse.json({ error: error?.message || "AI generation failed" }, { status: 500 });
    }
}
