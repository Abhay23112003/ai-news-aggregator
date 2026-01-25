import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { pool } from "../../../../../lib/db";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
  },

  events: {
    async signIn({ user }) {
      const email = user.email;
      if (!email) return;

      const client = await pool.connect();

      try {
        // 1️⃣ Create reading stats row (per user)
        await client.query(
          `
          INSERT INTO user_reading_stats (email)
          VALUES ($1)
          ON CONFLICT (email) DO NOTHING
          `,
          [email]
        );

        // 2️⃣ Create notification settings row (per user)
        await client.query(
          `
          INSERT INTO notification_settings (email)
          VALUES ($1)
          ON CONFLICT (email) DO NOTHING
          `,
          [email]
        );
      } catch (err) {
        console.error("Error during signIn event:", err);
      } finally {
        client.release();
      }
    },
  },
});

export { handler as GET, handler as POST };
