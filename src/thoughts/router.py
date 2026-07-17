from fastapi import APIRouter, Depends, status
from src.thoughts import controller
from src.thoughts.schema import thought_schema
from src.utils.db import get_db

thought_router = APIRouter(prefix="/thought")


@thought_router.post("/create",status_code=status.HTTP_201_CREATED)
def create_thought(body:thought_schema,db=Depends(get_db)):
    return controller.create_thought(body,db)



@thought_router.get("/all_thought",status_code=status.HTTP_200_OK)
def get_all_thought(db=Depends(get_db)):
    return controller.get_all_thought(db)