from src.thoughts.schema import thought_schema, thought_response_schema
from fastapi import APIRouter, Depends, status
from src.utils.helper import is_authenticated
from src.user.model import UserModel
from src.thoughts import controller
from sqlalchemy.orm import Session
from src.utils.db import get_db
from typing import List



thought_router = APIRouter(prefix="/thought")


@thought_router.post("/create",response_model=thought_response_schema,status_code=status.HTTP_201_CREATED)
def create_thought(body:thought_schema,db:Session = Depends(get_db),user: UserModel = Depends(is_authenticated)):
    return controller.create_thought(body,db,user)



@thought_router.get("/all_thought",response_model=List[thought_response_schema],status_code=status.HTTP_200_OK)
def get_all_thought(db:Session=Depends(get_db),user: UserModel = Depends(is_authenticated)):
    return controller.get_all_thought(db,user)



@thought_router.put("/update/{thought_id}",response_model=thought_response_schema,status_code=status.HTTP_201_CREATED)
def update_thought(body:thought_schema,thought_id:int,db:Session=Depends(get_db),user: UserModel = Depends(is_authenticated)):
    return controller.update_thought(body,thought_id,db,user)



@thought_router.delete("/delete/{thought_id}",status_code=status.HTTP_200_OK)
def delete_thought(thought_id:int,db:Session=Depends(get_db),user: UserModel = Depends(is_authenticated)):
    return controller.delete_thought(thought_id,db,user)