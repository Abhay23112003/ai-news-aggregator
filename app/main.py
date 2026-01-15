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



def main():
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

        summary = summarize_article(article)
        article["summary"] = summary
        save_article(article)

    # Send email after pipeline run
    recent_articles = get_recent_articles(limit=10)
    html_content = build_email_html(recent_articles)

    send_email(
        subject="📰 AI News Digest (Every 6 Hours)",
        html_content=html_content
    )

    print("Pipeline run completed successfully.")


if __name__ == "__main__":
    main()
