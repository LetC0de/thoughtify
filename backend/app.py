from fastapi import FastAPI
from src.utils.db import engine, base
from src.thoughts.router import thought_router

base.metadata.create_all(bind=engine)



app = FastAPI(title="Thoughtify: a thought sharing platform")

app.include_router(thought_router)

