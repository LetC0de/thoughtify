from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from src.utils.db import get_db
from src.thoughts.model import CommentModel, thought_model
from src.dependencies.admin_auth import require_admin

router = APIRouter(prefix="/admin/comments", tags=["Admin Comments"])


@router.get("")
def list_comments(
    search: str = Query("", max_length=100),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    admin=Depends(require_admin),
    db: Session = Depends(get_db),
):
    offset = (page - 1) * limit
    query = db.query(CommentModel)

    if search:
        like = f"%{search}%"
        query = query.filter(CommentModel.content.ilike(like))

    total = query.count()
    comments = (
        query.order_by(CommentModel.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    return {
        "comments": [
            {
                "id": c.id,
                "content": c.content[:120] + "..." if len(c.content or "") > 120 else c.content,
                "author_username": c.author.username if c.author else "unknown",
                "author_id": c.user_id,
                "thought_id": c.thought_id,
                "reply_count": c.reply_count or 0,
                "is_deleted": bool(c.is_deleted),
                "created_at": str(c.created_at),
            }
            for c in comments
        ],
        "total": total,
        "page": page,
        "limit": limit,
    }


@router.delete("/{comment_id}")
def delete_comment(
    comment_id: int,
    admin=Depends(require_admin),
    db: Session = Depends(get_db),
):
    comment = (
        db.query(CommentModel)
        .filter(CommentModel.id == comment_id)
        .first()
    )
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    db.delete(comment)
    db.commit()
    return {"message": "Comment deleted"}
