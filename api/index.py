from fastapi import FastAPI,Query
from app.services.database import get_recent_articles

app = FastAPI(title="AI News API")

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/articles")
def articles(limit:int=Query(10,ge=1,le=10)):
    articles=get_recent_articles(limit=limit)
    return {
        "count":len(articles),
        "articles":articles
    }