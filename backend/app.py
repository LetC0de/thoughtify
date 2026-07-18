from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.utils.db import engine, base
from src.thoughts.router import thought_router

base.metadata.create_all(bind=engine)



app = FastAPI(title="Thoughtify: a thought sharing platform")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5500", "http://localhost:5500", "http://127.0.0.1:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(thought_router)

