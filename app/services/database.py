import os
import psycopg
from psycopg.rows import dict_row

DATABASE_URL = os.getenv("DATABASE_URL")

def get_connection():
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL is not set")
    return psycopg.connect(DATABASE_URL, row_factory=dict_row)


# ---------- WRITE (used by GitHub Actions) ----------
def save_article(article):
    query = """
        INSERT INTO articles (title, summary, source, link, image_url)
        VALUES (%s, %s, %s, %s, %s)
        ON CONFLICT (link) DO NOTHING
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                query,
                (
                    article["title"],
                    article["summary"],
                    article["source"],
                    article["link"],
                    article.get("image_url"),
                ),
            )


# ---------- READ (used by FastAPI) ----------
def get_recent_articles(limit: int = 10):
    query = """
        SELECT title, summary, source, link, image_url, created_at
        FROM articles
        ORDER BY created_at DESC
        LIMIT %s
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, (limit,))
            rows = cur.fetchall()

    # rows are already dicts because of dict_row
    return [
        {
            "title": row["title"],
            "summary": row["summary"],
            "source": row["source"],
            "link": row["link"],
            "image_url": row["image_url"],
            "created_at": row["created_at"],
        }
        for row in rows
    ]
