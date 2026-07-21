from src.thoughts.schema import thought_schema, thought_feed_schema
from sqlalchemy.orm import Session, joinedload
from src.thoughts.model import thought_model
from fastapi import HTTPException
from src.user.model import UserModel


def create_thought(body: thought_schema, db: Session, user: UserModel):

    data = body.model_dump()

    new_thought = thought_model(title=data["title"],
                                content=data["content"],
                                user_id=user.id)

    db.add(new_thought)
    db.commit()
    db.refresh(new_thought)

    return new_thought


def get_global_feed(db: Session, user: UserModel):
    """Return all thoughts from all users, newest first, with author info."""
    thoughts = (
        db.query(thought_model)
        .options(joinedload(thought_model.author))
        .order_by(thought_model.id.desc())
        .all()
    )
    return [
        thought_feed_schema(
            id=t.id,
            title=t.title,
            content=t.content,
            user_id=t.user_id,
            created_at=t.created_at,
            author_name=t.author.name if t.author else "",
            author_username=t.author.username if t.author else "",
        )
        for t in thoughts
    ]


def get_my_thoughts(db: Session, user: UserModel):
    """Return only the current user's thoughts, newest first."""
    thoughts = (
        db.query(thought_model)
        .options(joinedload(thought_model.author))
        .filter(thought_model.user_id == user.id)
        .order_by(thought_model.id.desc())
        .all()
    )
    return [
        thought_feed_schema(
            id=t.id,
            title=t.title,
            content=t.content,
            user_id=t.user_id,
            created_at=t.created_at,
            author_name=t.author.name if t.author else "",
            author_username=t.author.username if t.author else "",
        )
        for t in thoughts
    ]


def update_thought(body: thought_schema, thought_id: int, db: Session, user: UserModel):

    thought: thought_model = db.query(thought_model).get(thought_id)

    if not thought:
        raise HTTPException(status_code=404, detail="Thought not found")

    if thought.user_id != user.id:
        raise HTTPException(status_code=401, detail="Unauthorized to update thought")

    body = body.model_dump()
    for field, value in body.items():
        setattr(thought, field, value)

    db.add(thought)
    db.commit()
    db.refresh(thought)

    return thought


def delete_thought(thought_id: int, db: Session, user: UserModel):
    thought: thought_model = db.query(thought_model).get(thought_id)

    if not thought:
        raise HTTPException(status_code=404, detail="Thought not found")

    if thought.user_id != user.id:
        raise HTTPException(status_code=401, detail="Unauthorized to delete thought")

    db.delete(thought)
    db.commit()

    return {"message": "Thought deleted Successfully"}