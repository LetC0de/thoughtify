from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional


class CommentCreate(BaseModel):
    content: str
    parent_comment_id: Optional[int] = None


class CommentResponse(BaseModel):
    id: int
    thought_id: int
    user_id: int
    parent_comment_id: Optional[int] = None
    content: str
    likes_count: int = 0
    reply_count: int = 0
    is_edited: bool = False
    is_deleted: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    author_name: str = ""
    author_username: str = ""
    replies: List["CommentResponse"] = []


class CommentDeleteResponse(BaseModel):
    message: str
