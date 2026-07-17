from fastapi import APIRouter, Depends
from src.thoughts import controller
from src.thoughts.schema import thought_schema
from src.utils.db import get_db

thought_router = APIRouter(prefix="/thought")


@thought_router.post("/create")
def create_thought(body:thought_schema,db=Depends(get_db)):
    return controller.create_thought(body,db)