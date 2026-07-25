from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from src.utils.db import get_db
from src.user.model import UserModel
from src.dependencies.admin_auth import require_admin

router = APIRouter(prefix="/admin/users", tags=["Admin Users"])


@router.get("")
def list_users(
    search: str = Query("", max_length=100),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    admin=Depends(require_admin),
    db: Session = Depends(get_db),
):
    offset = (page - 1) * limit
    query = db.query(UserModel)

    if search:
        like = f"%{search}%"
        query = query.filter(
            UserModel.username.ilike(like)
            | UserModel.email.ilike(like)
            | UserModel.name.ilike(like)
        )

    total = query.count()
    users = query.order_by(UserModel.id.desc()).offset(offset).limit(limit).all()

    return {
        "users": [
            {
                "id": u.id,
                "username": u.username,
                "email": u.email,
                "name": u.name,
                "role": u.role,
                "status": u.status,
                "joined": str(u.id),  # proxy — id order reflects join order
            }
            for u in users
        ],
        "total": total,
        "page": page,
        "limit": limit,
    }


@router.get("/{user_id}")
def get_user(
    user_id: int,
    admin=Depends(require_admin),
    db: Session = Depends(get_db),
):
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    from src.thoughts.model import thought_model, CommentModel

    post_count = (
        db.query(func.count(thought_model.id))
        .filter(thought_model.user_id == user_id)
        .scalar()
    )
    comment_count = (
        db.query(func.count(CommentModel.id))
        .filter(CommentModel.user_id == user_id)
        .scalar()
    )

    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "name": user.name,
        "role": user.role,
        "status": user.status,
        "post_count": post_count,
        "comment_count": comment_count,
        "last_seen": str(user.last_seen) if user.last_seen else None,
    }
