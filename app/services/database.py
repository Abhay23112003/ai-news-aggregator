import os
import psycopg
from psycopg.rows import dict_row
import uuid

DATABASE_URL = os.getenv("DATABASE_URL")

def get_connection():
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL is not set")
    return psycopg.connect(DATABASE_URL, row_factory=dict_row)


# ---------- WRITE (used by GitHub Actions) ----------
def save_article(article):
    query = """
        INSERT INTO articles (title, summary, source, link, image_url, trending, category, bookmark)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
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
                    article.get("trending"),
                    article.get("category"),
                    article.get("bookmark")
                ),
            )


# ---------- READ (used by FastAPI) ----------
def get_recent_articles(limit: int = 10):
    query = """
        SELECT id,title, summary, source, link, image_url, trending, category, bookmark, created_at
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
            "id": row["id"],
            "title": row["title"],
            "summary": row["summary"],
            "source": row["source"],
            "link": row["link"],
            "image_url": row["image_url"],
            "trending": row["trending"],
            "category": row["category"],
            "bookmark": row["bookmark"],
            "created_at": row["created_at"],
        }
        for row in rows
    ]

def update_bookmark(article_id:uuid.UUID,is_bookmarked:bool):
    query="""
    UPDATE articles
    SET bookmark=%s
    WHERE id=%s
    """

    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(query,(is_bookmarked,article_id))
                if cur.rowcount==0:
                    print(f"No article found with id:{article_id}")
                    return False
        return True
    except Exception as e:
        print(f"DATABASE ERROR:{e}")
        return False
    
# ---------- UPDATE (Reading Time) ----------
def increment_reading_time(email: str, seconds_to_add: int):
    """
    Increments the total reading time for a user.
    If the user doesn't exist, it creates a new record.
    """
    # Using 'ON CONFLICT' ensures that if it's a new user, 
    # we insert them; if they exist, we just add the time.
    query = """
        INSERT INTO user_reading_stats (email, total_seconds)
        VALUES (%s, %s)
        ON CONFLICT (email) 
        DO UPDATE SET 
            total_seconds = user_reading_stats.total_seconds + EXCLUDED.total_seconds,
            last_updated = CURRENT_TIMESTAMP;
    """
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(query, (email, seconds_to_add))
        return True
    except Exception as e:
        print(f"Database error while incrementing time: {e}")
        return False
    
def get_user_reading_time(email: str):
    query = "SELECT total_seconds FROM user_reading_stats WHERE email = %s"
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, (email,))
            row = cur.fetchone()
            return row["total_seconds"] if row else 0


