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

def  should_send_email():
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
    
    email_enabled, frequency, last_sent_at = row
    if not email_enabled:
        print("Email notifications are OFF")
        return False
    now = datetime.now(timezone.utc)
    # First ever email
    if last_sent_at is None:
        print("No last_sent_at → allow email")
        return True
    if frequency == "hourly":
        return now - last_sent_at >= timedelta(hours=1)

    if frequency == "6hour":
        return now - last_sent_at >= timedelta(hours=6)

    if frequency == "daily":
        return now - last_sent_at >= timedelta(days=1)

    return False

def update_last_sent_at():
    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        print("DATABASE_URL not set while updating last_sent_at")
        return

    with psycopg.connect(DATABASE_URL) as conn:
        with conn.cursor() as cur:
            cur.execute("""
                UPDATE notification_settings
                SET last_sent_at = now()
                WHERE id = true
            """)
        conn.commit()

    print("Updated last_sent_at successfully")

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
    # 1. Consolidated check
    settings = get_notification_settings() # Helper to return the row or None
    if not settings or not should_send_email():
        print("Skipping pipeline...")
        print(f"Output of should send email func:{should_send_email()}")
        return

    email_enabled, frequency, last_sent_at = settings

    # 2. Processing
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

    # 3. Email Logic
    # Only get articles newer than the last email sent
    recent_articles = get_recent_articles(limit=10)
    
    if recent_articles:
        html_content = build_email_html(recent_articles)
        send_email(
            subject=f"📰 AI News Digest ({frequency})",
            html_content=html_content
        )
        update_last_sent_at()
        print("Pipeline run completed successfully.")
    else:
        print("No new relevant articles to send.")

if __name__ == "__main__":
    main()
