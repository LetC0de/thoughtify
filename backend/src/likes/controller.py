from sqlalchemy.orm import Session
from fastapi import HTTPException
from src.thoughts.model import thought_model, LikeModel
from src.user.model import UserModel


def toggle_like(thought_id: int, db: Session, user: UserModel):

    # Check thought exists
    thought = db.query(thought_model).filter(thought_model.id == thought_id).first()
    if not thought:
        raise HTTPException(status_code=404, detail="Thought not found")

    # Check if already liked
    existing = db.query(LikeModel).filter(
        LikeModel.user_id == user.id,
        LikeModel.thought_id == thought_id
    ).first()

    if existing:
        # Unlike
        db.delete(existing)
        thought.likes_count = max(0, (thought.likes_count or 0) - 1)
        db.commit()
        return {"liked": False, "likes": thought.likes_count or 0}
    else:
        # Like
        new_like = LikeModel(user_id=user.id, thought_id=thought_id)
        db.add(new_like)
        thought.likes_count = (thought.likes_count or 0) + 1
        db.commit()
        return {"liked": True, "likes": thought.likes_count or 0}
