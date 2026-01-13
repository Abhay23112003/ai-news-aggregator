import sqlite3
from pathlib import Path

DB_PATH=Path("data/news.db")

def init_db():
    DB_PATH.parent.mkdir(exist_ok=True)

    conn=sqlite3.connect(DB_PATH)
    cursor=conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS articles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            summary TEXT,
            source TEXT,
            link TEXT UNIQUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    conn.commit()
    conn.close()

def save_article(article:dict):
    conn=sqlite3.connect(DB_PATH)
    cursor=conn.cursor()

    cursor.execute("""
        INSERT OR IGNORE INTO articles (title, summary, source, link)
        VALUES (?, ?, ?, ?)
    """,(
        article["title"],
        article["summary"],
        article["source"],
        article["link"]
    ))

    conn.commit()
    conn.close()

def get_recent_articles(limit:int=10):
    conn=sqlite3.connect(DB_PATH)
    cursor=conn.cursor()

    rows=cursor.execute("""
        SELECT title,summary,source,link,created_at
        FROM articles
        ORDER BY created_at DESC
        LIMIT ?
    """,(limit,)).fetchall()

    conn.close()

    articles=[]
    for row in rows:
        articles.append({
            "title": row[0],
            "summary": row[1],
            "source": row[2],
            "link": row[3],
            "created_at": row[4],
        })
    return articles