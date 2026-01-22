import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY!,
});

export async function POST(req: Request) {
    try {
        const { text } = await req.json();

        if (!text) {
            return NextResponse.json({ error: "Text is required" }, { status: 400 });
        }

        const response = await groq.audio.speech.create({
            model: "canopylabs/orpheus-v1-english",
            voice: "troy",
            input: text,
            response_format: "wav", // Correct and required
        });

        const audioBuffer = Buffer.from(await response.arrayBuffer());

        return new NextResponse(audioBuffer, {
            headers: {
                "Content-Type": "audio/wav",
            },
        });

    } catch (error) {
        console.error("TTS error:", error);
        return NextResponse.json({ error: "TTS failed" }, { status: 500 });
    }
}
