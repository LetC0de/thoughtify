from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from src.utils.db import get_db
from src.utils.helper import is_authenticated
from src.user.model import UserModel
from src.likes.schema import LikeResponse
from src.likes import controller

like_router = APIRouter(prefix="/thought")


@like_router.post("/{thought_id}/like", response_model=LikeResponse, status_code=status.HTTP_200_OK)
def toggle_like(thought_id: int, db: Session = Depends(get_db), user: UserModel = Depends(is_authenticated)):
    return controller.toggle_like(thought_id, db, user)
