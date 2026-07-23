from src.thoughts.schema import thought_schema, thought_feed_schema
from src.thoughts.model import thought_model, LikeModel
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException
from src.user.model import UserModel


def _build_feed_item(t, liked_ids=None):
    """Build a thought_feed_schema from a thought_model row."""
    liked_by_me = False
    if liked_ids is not None:
        liked_by_me = t.id in liked_ids
    return thought_feed_schema(
        id=t.id,
        title=t.title,
        content=t.content,
        user_id=t.user_id,
        created_at=t.created_at,
        likes_count=t.likes_count or 0,
        liked_by_me=liked_by_me,
        author_name=t.author.name if t.author else "",
        author_username=t.author.username if t.author else "",
    )


def _get_liked_thought_ids(user_id: int, thought_ids: list[int], db: Session) -> set:
    """Return set of thought_ids that the user has liked."""
    if not thought_ids:
        return set()
    rows = (
        db.query(LikeModel.thought_id)
        .filter(
            LikeModel.user_id == user_id,
            LikeModel.thought_id.in_(thought_ids),
        )
        .all()
    )
    return {r[0] for r in rows}


def create_thought(body: thought_schema, db: Session, user: UserModel):

    data = body.model_dump()

    new_thought = thought_model(title=data["title"],
                                content=data["content"],
                                user_id=user.id)

    db.add(new_thought)
    db.commit()
    db.refresh(new_thought)

    return new_thought


def get_thought_by_id(thought_id: int, db: Session, user: UserModel | None = None):
    """Return a single thought by ID with full content and author info."""
    thought = (
        db.query(thought_model)
        .options(joinedload(thought_model.author))
        .filter(thought_model.id == thought_id)
        .first()
    )
    if not thought:
        raise HTTPException(status_code=404, detail="Thought not found")

    liked_by_me = False
    if user:
        liked = db.query(LikeModel).filter(
            LikeModel.user_id == user.id,
            LikeModel.thought_id == thought_id
        ).first()
        liked_by_me = liked is not None

    return thought_feed_schema(
        id=thought.id,
        title=thought.title,
        content=thought.content,
        user_id=thought.user_id,
        created_at=thought.created_at,
        likes_count=thought.likes_count or 0,
        liked_by_me=liked_by_me,
        author_name=thought.author.name if thought.author else "",
        author_username=thought.author.username if thought.author else "",
    )


def get_public_feed(db: Session):
    """Public feed — no auth required. Shows recent thoughts."""
    thoughts = (
        db.query(thought_model)
        .options(joinedload(thought_model.author))
        .filter(thought_model.user_id.isnot(None))
        .order_by(thought_model.id.desc())
        .limit(50)
        .all()
    )
    return [
        thought_feed_schema(
            id=t.id,
            title=t.title,
            content=t.content[:300] + ("..." if len(t.content or "") > 300 else ""),
            user_id=t.user_id,
            created_at=t.created_at,
            likes_count=t.likes_count or 0,
            author_name=t.author.name if t.author else "",
            author_username=t.author.username if t.author else "",
        )
        for t in thoughts
    ]


def get_global_feed(db: Session, user: UserModel):
    """Return all thoughts from all users, newest first, with author info."""
    thoughts = (
        db.query(thought_model)
        .options(joinedload(thought_model.author))
        .order_by(thought_model.id.desc())
        .all()
    )
    thought_ids = [t.id for t in thoughts]
    liked_ids = _get_liked_thought_ids(user.id, thought_ids, db)
    return [_build_feed_item(t, liked_ids) for t in thoughts]


def get_my_thoughts(db: Session, user: UserModel):
    """Return only the current user's thoughts, newest first."""
    thoughts = (
        db.query(thought_model)
        .options(joinedload(thought_model.author))
        .filter(thought_model.user_id == user.id)
        .order_by(thought_model.id.desc())
        .all()
    )
    thought_ids = [t.id for t in thoughts]
    liked_ids = _get_liked_thought_ids(user.id, thought_ids, db)
    return [_build_feed_item(t, liked_ids) for t in thoughts]


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