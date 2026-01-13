import time
import schedule

from app.scrapers.rss_scraper import fetch_rss
from app.scrapers.article_fetcher import fetch_article_html
from app.services.article_parser import extract_article_text
from app.services.normalizer import normalize_articles
from app.services.relevance import is_relevant
from app.services.ai_summarizer import summarize_article
from app.services.database import init_db, save_article, get_recent_articles
from app.services.email_formatter import build_email_html
from app.services.email_service import send_email


def run_pipeline():
    init_db()
    feed_url = "https://feeds.bbci.co.uk/news/rss.xml"

    raw_articles = fetch_rss(feed_url, limit=5)
    articles = normalize_articles(raw_articles, source="BBC News")

    for article in articles:
        if not is_relevant(article):
            continue

        try:
            html = fetch_article_html(article["link"])
            article["full_text"] = extract_article_text(html)
        except Exception:
            continue

        summary = summarize_article(article)
        article["summary"] = summary
        save_article(article)

    # 👉 Send email after each run
    recent_articles = get_recent_articles(limit=10)
    html_content = build_email_html(recent_articles)

    send_email(
        subject="📰 AI News Digest (Every 6 Hours)",
        html_content=html_content
    )

    print("Pipeline completed and email sent.")


def main():
    # Run once at startup
    run_pipeline()

    # Run every 6 hours
    schedule.every(6).hours.do(run_pipeline)

    print("Scheduler started. Email will be sent every 6 hours.")

    while True:
        schedule.run_pending()
        time.sleep(60)


if __name__ == "__main__":
    main()
