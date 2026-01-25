import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // 1️⃣ Try fetching existing settings
    const existing = await pool.query(
      `SELECT email_enabled, frequency
       FROM notification_settings
       WHERE email = $1`,
      [email]
    );

    if (existing.rows.length > 0) {
      return NextResponse.json({
        data: existing.rows[0],
      });
    }

    // 2️⃣ First-time user → insert defaults
    const inserted = await pool.query(
      `
      INSERT INTO notification_settings (email)
      VALUES ($1)
      RETURNING email_enabled, frequency
      `,
      [email]
    );

    return NextResponse.json({
      data: inserted.rows[0],
    });

  } catch (err) {
    console.error("GET notification settings error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


export async function POST(req: Request) {
  try {
    const { email, email_enabled, frequency } = await req.json();

    if (!email || !frequency) {
      return NextResponse.json(
        { error: "Email and frequency are required" },
        { status: 400 }
      );
    }

    await pool.query(
      `
      INSERT INTO notification_settings (email, email_enabled, frequency)
      VALUES ($1, $2, $3)
      ON CONFLICT (email)
      DO UPDATE SET
        email_enabled = EXCLUDED.email_enabled,
        frequency = EXCLUDED.frequency,
        last_updated_at = now()
      `,
      [email, email_enabled, frequency]
    );

    return NextResponse.json({ message: "Notification settings saved" });

  } catch (error) {
    console.error("POST notification settings error:", error);
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }
}
