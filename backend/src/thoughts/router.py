from fastapi import APIRouter, Depends, status
from src.thoughts import controller
from src.thoughts.schema import thought_schema, thought_response_schema
from src.utils.db import get_db
from sqlalchemy.orm import Session
from typing import List

thought_router = APIRouter(prefix="/thought")


@thought_router.post("/create",response_model=thought_response_schema,status_code=status.HTTP_201_CREATED)
def create_thought(body:thought_schema,db:Session = Depends(get_db)):
    return controller.create_thought(body,db)



@thought_router.get("/all_thought",response_model=List[thought_response_schema],status_code=status.HTTP_200_OK)
def get_all_thought(db:Session=Depends(get_db)):
    return controller.get_all_thought(db)



@thought_router.put("/update/{thought_id}",response_model=thought_response_schema,status_code=status.HTTP_201_CREATED)
def update_thought(body:thought_schema,thought_id:int,db:Session=Depends(get_db)):
    return controller.update_thought(body,thought_id,db)



@thought_router.delete("/delete/{thought_id}",status_code=status.HTTP_200_OK)
def delete_thought(thought_id:int,db:Session=Depends(get_db)):
    return controller.delete_thought(thought_id,db)