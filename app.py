from fastapi import FastAPI
from src.utils.db import engine, base

base.metadata.create_all(bind=engine)



app = FastAPI(title="Thoughtify: a thought sharing platform")

