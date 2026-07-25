from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from src.utils.db import get_db
from src.thoughts.model import thought_model, CommentModel, LikeModel
from src.dependencies.admin_auth import require_admin

router = APIRouter(prefix="/admin/posts", tags=["Admin Posts"])


@router.get("")
def list_posts(
    search: str = Query("", max_length=100),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    admin=Depends(require_admin),
    db: Session = Depends(get_db),
):
    offset = (page - 1) * limit
    query = db.query(thought_model)

    if search:
        like = f"%{search}%"
        query = query.filter(
            thought_model.title.ilike(like) | thought_model.content.ilike(like)
        )

    total = query.count()
    posts = (
        query.order_by(thought_model.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    return {
        "posts": [
            {
                "id": p.id,
                "title": p.title,
                "author_username": p.author.username if p.author else "unknown",
                "author_id": p.user_id,
                "likes_count": p.likes_count,
                "comments_count": (
                    db.query(CommentModel)
                    .filter(CommentModel.thought_id == p.id)
                    .count()
                ),
                "created_at": str(p.created_at),
            }
            for p in posts
        ],
        "total": total,
        "page": page,
        "limit": limit,
    }


@router.get("/{post_id}")
def get_post(
    post_id: int,
    admin=Depends(require_admin),
    db: Session = Depends(get_db),
):
    post = (
        db.query(thought_model)
        .filter(thought_model.id == post_id)
        .first()
    )
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    comments = (
        db.query(CommentModel)
        .filter(CommentModel.thought_id == post_id)
        .order_by(CommentModel.created_at.desc())
        .limit(20)
        .all()
    )

    return {
        "id": post.id,
        "title": post.title,
        "content": post.content,
        "author_username": post.author.username if post.author else "unknown",
        "author_id": post.user_id,
        "likes_count": post.likes_count,
        "created_at": str(post.created_at),
        "comments": [
            {
                "id": c.id,
                "content": c.content[:100] if c.content else "",
                "author_username": c.author.username if c.author else "unknown",
                "created_at": str(c.created_at),
            }
            for c in comments
        ],
    }


@router.delete("/{post_id}")
def delete_post(
    post_id: int,
    admin=Depends(require_admin),
    db: Session = Depends(get_db),
):
    post = (
        db.query(thought_model)
        .filter(thought_model.id == post_id)
        .first()
    )
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    db.delete(post)
    db.commit()
    return {"message": "Post deleted"}
