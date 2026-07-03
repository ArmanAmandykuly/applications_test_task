from fastapi import FastAPI
from fastapi.concurrency import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware

from app.core.db import init_db
from app.api.v1.applications import router as applications_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(
    title="Core Backend Service",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],  # Allows GET, POST, PATCH, DELETE, OPTIONS
    allow_headers=["*"],  # Allows Authorization, Content-Type, etc.
)

app.include_router(applications_router, prefix="/api/v1")

@app.get("/health")
def read_root():
    # 3. Return a standard dictionary (FastAPI auto-serializes this to JSON)
    return {"status": "healthy", "message": "System operational"}