from fastapi import HTTPException, status, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta, timezone
from pwdlib import PasswordHash
import jwt

from src.utils.db import get_db
from src.utils.settings import settings
from src.utils.helper import is_authenticated
from src.user.model import UserModel
from src.thoughts.model import thought_model, CommentModel, LikeModel

password_hash = PasswordHash.recommended()


# ── Auth ──

def require_admin(
    user=Depends(is_authenticated),
):
    """Verify the authenticated user has ADMIN role."""
    if user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return user


def login_admin(email: str, password: str, db: Session):
    user = db.query(UserModel).filter(UserModel.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Not an admin account")

    if not password_hash.verify(password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    exp_time = datetime.now(timezone.utc) + timedelta(hours=24)
    token = jwt.encode(
        {"_id": user.id, "exp": exp_time.timestamp()},
        settings.SECRET_KEY,
        settings.ALGORITHM,
    )

    return {
        "token": token,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "name": user.name,
            "role": user.role,
        },
    }


def get_admin_profile(admin: UserModel):
    return {
        "id": admin.id,
        "username": admin.username,
        "email": admin.email,
        "name": admin.name,
        "role": admin.role,
    }


# ── Dashboard ──

def get_dashboard_stats(db: Session):
    total_users = db.query(func.count(UserModel.id)).scalar()
    total_posts = db.query(func.count(thought_model.id)).scalar()
    total_comments = db.query(func.count(CommentModel.id)).scalar()

    five_mins_ago = datetime.now(timezone.utc) - timedelta(minutes=5)
    online_users = (
        db.query(func.count(UserModel.id))
        .filter(
            UserModel.last_seen >= five_mins_ago,
            (UserModel.role != "ADMIN") | (UserModel.role.is_(None)),
        )
        .scalar()
    )

    recent_users = (
        db.query(UserModel)
        .order_by(UserModel.id.desc())
        .limit(5)
        .all()
    )

    recent_posts = (
        db.query(thought_model)
        .order_by(thought_model.created_at.desc())
        .limit(5)
        .all()
    )

    recent_comments = (
        db.query(CommentModel)
        .order_by(CommentModel.created_at.desc())
        .limit(5)
        .all()
    )

    return {
        "stats": {
            "total_users": total_users,
            "total_posts": total_posts,
            "total_comments": total_comments,
            "online_users": online_users,
        },
        "recent_users": [
            {
                "id": u.id,
                "username": u.username,
                "email": u.email,
                "name": u.name,
                "created_at": str(u.created_at) if u.created_at else None,
            }
            for u in recent_users
        ],
        "recent_posts": [
            {
                "id": p.id,
                "title": p.title,
                "author_username": p.author.username if p.author else "unknown",
                "likes_count": p.likes_count,
                "created_at": str(p.created_at),
            }
            for p in recent_posts
        ],
        "recent_comments": [
            {
                "id": c.id,
                "content": c.content[:80] + "..." if len(c.content or "") > 80 else c.content,
                "author_username": c.author.username if c.author else "unknown",
                "thought_id": c.thought_id,
                "created_at": str(c.created_at),
            }
            for c in recent_comments
        ],
    }


# ── Active Users ──

def get_active_users(db: Session, search: str, page: int, limit: int):
    offset = (page - 1) * limit
    five_mins_ago = datetime.now(timezone.utc) - timedelta(minutes=5)
    # `role` may be NULL for users who existed before the migration that added it.
    # Explicitly treat NULL as non-ADMIN so those users aren't silently excluded.
    query = db.query(UserModel).filter(
        UserModel.last_seen >= five_mins_ago,
        (UserModel.role != "ADMIN") | (UserModel.role.is_(None)),
    )

    if search:
        like = f"%{search}%"
        query = query.filter(
            UserModel.username.ilike(like)
            | UserModel.email.ilike(like)
            | UserModel.name.ilike(like)
        )

    total = query.count()
    users = query.order_by(UserModel.last_seen.desc()).offset(offset).limit(limit).all()

    return {
        "users": [
            {
                "id": u.id,
                "username": u.username,
                "email": u.email or "—",
                "name": u.name,
                "role": u.role or "USER",
                "last_seen": str(u.last_seen) if u.last_seen else None,
            }
            for u in users
        ],
        "total": total,
        "page": page,
        "limit": limit,
    }


# ── Users ──

def list_users(db: Session, search: str, page: int, limit: int):
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
                "joined": str(u.created_at) if u.created_at else None,
            }
            for u in users
        ],
        "total": total,
        "page": page,
        "limit": limit,
    }


# ── Posts ──

def list_posts(db: Session, search: str, page: int, limit: int):
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


def get_post_detail(post_id: int, db: Session):
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


def delete_post(post_id: int, db: Session):
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


# ── User Management ──

def delete_user(user_id: int, db: Session):
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.role == "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot delete an admin account",
        )

    # Delete user's comments, likes, thoughts
    db.query(LikeModel).filter(LikeModel.user_id == user_id).delete()
    db.query(CommentModel).filter(CommentModel.user_id == user_id).delete()
    db.query(thought_model).filter(thought_model.user_id == user_id).delete()
    db.delete(user)
    db.commit()
    return {"message": "User deleted"}


# ── Comments ──

def list_comments(db: Session, search: str, page: int, limit: int):
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


def delete_comment(comment_id: int, db: Session):
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
