from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List

from src.utils.db import get_db
from src.utils.helper import is_authenticated, get_optional_user
from src.user.model import UserModel
from src.comments.schema import CommentCreate, CommentResponse
from src.comments import controller

comment_router = APIRouter(prefix="/thought")


@comment_router.post("/{thought_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
def create_comment(
    thought_id: int,
    body: CommentCreate,
    db: Session = Depends(get_db),
    user: UserModel = Depends(is_authenticated),
):
    return controller.create_comment(thought_id, body, db, user)


@comment_router.get("/{thought_id}/comments", response_model=List[CommentResponse], status_code=status.HTTP_200_OK)
def get_comments(
    thought_id: int,
    db: Session = Depends(get_db),
    user: UserModel | None = Depends(get_optional_user),
):
    return controller.get_comments(thought_id, db)


@comment_router.delete("/comments/{comment_id}", status_code=status.HTTP_200_OK)
def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    user: UserModel = Depends(is_authenticated),
):
    return controller.delete_comment(comment_id, db, user)
