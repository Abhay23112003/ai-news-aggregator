from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from app.services.database import get_recent_articles

app = FastAPI(title="AI News API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Add your frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/articles")
def articles(limit: int = Query(10, ge=1, le=100)):
    articles = get_recent_articles(limit=limit)
    return {
        "count": len(articles),
        "articles": articles
    }