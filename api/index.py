from fastapi import FastAPI

app = FastAPI(title="AI News API")

@app.get("/health")
def health():
    return {"status": "ok"}
