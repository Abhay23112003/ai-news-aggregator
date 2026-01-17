import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) return NextResponse.json({ total_seconds: 0 });

    // Calling FastAPI using query parameter format: /get-time?email=...
    const response = await fetch(`${BACKEND_URL}/get-time?email=${email}`, {
      cache: 'no-store',
    });

    if (!response.ok) return NextResponse.json({ total_seconds: 0 });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ total_seconds: 0 });
  }
}