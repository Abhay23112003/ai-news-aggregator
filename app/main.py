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
                FROM notifiaction_settings
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

def main():
    if not should_send_email():
        print("Skipping pipeline: notification rules not satisfied")
        return

    feed_url = "https://feeds.bbci.co.uk/news/rss.xml"

    raw_articles = fetch_rss(feed_url, limit=5)
    articles = normalize_articles(raw_articles, source="BBC News")

    for article in articles:
        if not is_relevant(article):
            continue

        try:
            html = fetch_article_html(article["link"])
            article["full_text"] = extract_article_text(html)
            article["image_url"] = extract_image_url(html)

        except Exception:
            continue

        json_data = summarize_article(article)
        if json_data["summary"]=='Summary unavailable':
            continue
        article["summary"] = json_data["summary"]
        article["trending"]=json_data["trending"]
        article["category"]=json_data["category"]
        save_article(article)

    # Send email after pipeline run
    recent_articles = get_recent_articles(limit=10)
    html_content = build_email_html(recent_articles)

    send_email(
        subject="📰 AI News Digest (Every 6 Hours)",
        html_content=html_content
    )
    update_last_sent_at()

    print("Pipeline run completed successfully.")


if __name__ == "__main__":
    main()
