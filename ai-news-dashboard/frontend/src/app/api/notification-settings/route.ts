import { NextResponse } from "next/server"
import { Pool } from "pg"

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_I51jiKrWnxLc@ep-plain-lake-a1h7rs9q-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
})

export async function GET() {
    try {
        const result = await pool.query(
            'select email_enabled,frequency from notification_settings where id=true'
        )
        return NextResponse.json({
            message: "Fetched successfully email notification settings",
            data: result.rows[0]
        })
    } catch (error) {
        return NextResponse.json({
            message: "Some Error came while fetching",
            error: error,
            status: "404"
        })
    }
}

export async function POST(req: Request) {
    const { email_enabled, frequency } = await req.json();
    try {
        const result = await pool.query(
            `
            UPDATE notification_settings
            SET 
                email_enabled = $1,
                frequency = $2,
                last_updated_at = now()
            WHERE id = true
            `,
            [email_enabled, frequency]
        );

        return NextResponse.json({
            message: "set successfully email notification settings",
        })
    } catch (error) {
        return NextResponse.json({
            message: "Some Error came while setting",
            error: error,
            status: "404"
        })
    }
}