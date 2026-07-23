from pydantic import BaseModel


class LikeResponse(BaseModel):
    liked: bool
    likes: int
