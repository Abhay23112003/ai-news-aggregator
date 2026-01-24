import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY, // The '!' is fine, but cleaner to check if it exists
});

function formatAsNewsAnchor(article: string) {
  return `Good evening.\n\nThis is your latest news update.\n\n${article.replace(/\.\s+/g, ".\n\n")}\n\nThis has been a developing story.\n\nThank you for listening.`;
}

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const formattedText = formatAsNewsAnchor(text);

    // Groq's TTS implementation
    const response = await groq.audio.speech.create({
      model: "canopylabs/orpheus-v1-english",
      voice: "narrator",
      input: formattedText,
      response_format: "wav", 
    });

    // Extract the binary data
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/wav",
        "Content-Length": audioBuffer.length.toString(),
      },
    });

  } catch (error: any) {
    console.error("TTS error:", error);
    // Be careful not to leak internal error messages to the client
    return NextResponse.json(
      { error: error.message || "TTS failed" }, 
      { status: 500 }
    );
  }
}