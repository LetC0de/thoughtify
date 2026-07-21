from pydantic import BaseModel
from datetime import datetime


class thought_schema(BaseModel):

    title : str
    content : str


class thought_response_schema(BaseModel):

    id : int
    title : str
    content : str
    user_id : int | None = None
    created_at: datetime | None = None


class thought_feed_schema(thought_response_schema):
    """Feed response includes author info."""
    author_name: str = ""
    author_username: str = ""