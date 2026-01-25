from app.scrapers.rss_scraper import fetch_rss
from app.scrapers.article_fetcher import fetch_article_html
from app.services.article_parser import extract_article_text
from app.services.normalizer import normalize_articles
from app.services.relevance import is_relevant
from app.services.ai_summarizer import summarize_article
from app.services.database import save_article, get_recent_articles
from app.services.email_formatter import build_email_html
from app.services.email_service import send_email
from app.services.article_parser import extract_image_url

import os
from datetime import datetime, timedelta, timezone
import psycopg

def get_all_notification_settings():
    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        print("DATABASE_URL not set")
        return []

    with psycopg.connect(DATABASE_URL) as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT email, email_enabled, frequency, last_sent_at
                FROM notification_settings
            """)
            rows = cur.fetchall()

    return rows


def get_all_notification_users():
    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        print("DATABASE_URL not set")
        return []

    with psycopg.connect(DATABASE_URL) as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT email, email_enabled, frequency, last_sent_at
                FROM notification_settings
                WHERE email_enabled = true
            """)
            rows = cur.fetchall()

    return rows

def should_send_email(frequency: str, last_sent_at):
    now = datetime.now(timezone.utc)

    # First ever email
    if last_sent_at is None:
        return True

    if frequency == "hourly":
        return now - last_sent_at >= timedelta(hours=1)

    if frequency == "6hour":
        return now - last_sent_at >= timedelta(hours=6)

    if frequency == "daily":
        return now - last_sent_at >= timedelta(days=1)

    return False

def update_last_sent_at(email: str):
    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        print("DATABASE_URL not set while updating last_sent_at")
        return

    with psycopg.connect(DATABASE_URL) as conn:
        with conn.cursor() as cur:
            cur.execute("""
                UPDATE notification_settings
                SET last_sent_at = now()
                WHERE email = %s
            """, (email,))
        conn.commit()


def get_notification_settings():
    DATABASE_URL=os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        print("DATABASE_URL not set")
        return False
    with psycopg.connect(DATABASE_URL) as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT email_enabled,frequency,last_sent_at
                FROM notification_settings
                where id=true
            """)
            row=cur.fetchone()
    if not row:
        print("No notification settings found")
        return False
    
    return row

def main():
    users = get_all_notification_settings()

    if not users:
        print("No users found. Exiting.")
        return

    # 1️⃣ Fetch articles ONCE (important)
    feed_url = "https://feeds.bbci.co.uk/news/rss.xml"
    raw_articles = fetch_rss(feed_url, limit=5)
    articles = normalize_articles(raw_articles, source="BBC News")

    processed_count = 0
    for article in articles:
        if not is_relevant(article):
            continue

        try:
            html = fetch_article_html(article["link"])
            article["full_text"] = extract_article_text(html)
            article["image_url"] = extract_image_url(html)

            json_data = summarize_article(article)
            if json_data["summary"] == 'Summary unavailable':
                continue

            article.update({
                "summary": json_data["summary"],
                "trending": json_data["trending"],
                "category": json_data["category"]
            })

            save_article(article)
            processed_count += 1

        except Exception as e:
            print(f"Error processing article: {e}")
            continue

    print(f"Articles processed: {processed_count}")

    # 2️⃣ Email logic PER USER
    recent_articles = get_recent_articles(limit=10)

    if not recent_articles:
        print("No new articles to email.")
        return

    html_content = build_email_html(recent_articles)

    for email, email_enabled, frequency, last_sent_at in users:
        if not email_enabled:
            continue

        if not should_send_email(frequency, last_sent_at):
            print(f"Skipping {email} — not time yet")
            continue

        try:
            print(f"📧 Attempting email for {email}")
            send_email(
                to_email=email,
                subject=f"📰 AI News Digest ({frequency})",
                html_content=html_content
            )

            update_last_sent_at(email)
            print(f"Email sent to {email}")

        except Exception as e:
            print(f"Failed sending email to {email}: {e}")


if __name__ == "__main__":
    main()
