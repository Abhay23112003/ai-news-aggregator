from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from app.services.database import get_recent_articles
from app.services.database import update_bookmark
from app.services.database import increment_reading_time
from app.services.database import get_user_reading_time
import uuid
from fastapi import HTTPException
from pydantic import BaseModel

app = FastAPI(title="AI News API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000","https://newsflow-eight.vercel.app"],  # Add your frontend URLs
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

class BookmarkRequest(BaseModel):
    article_id:uuid.UUID
    is_bookmarked:bool

@app.patch("/bookmark")
async def bookmark(pay_load:BookmarkRequest):
    response=update_bookmark(article_id=pay_load.article_id,is_bookmarked=pay_load.is_bookmarked)
    if response==True:
        return {
        "message": "Bookmark updated successfully",
        "article_id": pay_load.article_id,
        "is_bookmarked": pay_load.is_bookmarked
    }
    else:
        raise HTTPException(
            status_code=404,
            detail='Failed to update the bookmark'
        )

class TimeUpdate(BaseModel):
    email: str
    seconds: int

@app.post("/sync-time")
async def sync_time(data: TimeUpdate):
    success = increment_reading_time(data.email, data.seconds)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to sync time")
    return {"status": "success"}

@app.get("/get-time") # Removed /{email}
async def get_time(email: str): # FastAPI automatically treats this as a query param
    time = get_user_reading_time(email)
    return {"total_seconds": time}