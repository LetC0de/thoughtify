from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.utils.db import engine, base
from src.thoughts.router import thought_router
from src.user.router import user_router
from src.likes.router import like_router
from src.comments.router import comment_router
from src.user.otp_router import otp_router

base.metadata.create_all(bind=engine)



app = FastAPI(title="Thoughtify: a thought sharing platform")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500", "http://localhost:5500",
        "http://127.0.0.1:8000", "http://localhost:3000", "http://127.0.0.1:3000",
        "https://www.freespeak.in", "https://freespeak.in",
        "https://thoughtify-lmgv.onrender.com",
        "null"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(thought_router)
app.include_router(user_router)
app.include_router(like_router)
app.include_router(comment_router)
app.include_router(otp_router)
