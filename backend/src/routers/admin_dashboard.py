from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from sqlalchemy import func

from src.utils.db import get_db
from src.user.model import UserModel
from src.thoughts.model import thought_model, CommentModel
from src.dependencies.admin_auth import require_admin

router = APIRouter(prefix="/admin", tags=["Admin Dashboard"])


@router.get("/dashboard")
def admin_dashboard(
    admin=Depends(require_admin),
    db: Session = Depends(get_db),
):
    total_users = db.query(func.count(UserModel.id)).scalar()
    total_posts = db.query(func.count(thought_model.id)).scalar()
    total_comments = db.query(func.count(CommentModel.id)).scalar()

    five_mins_ago = datetime.now() - timedelta(minutes=5)
    online_users = (
        db.query(func.count(UserModel.id))
        .filter(UserModel.last_seen >= five_mins_ago)
        .scalar()
    )

    # ── Recent activity ──
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
                "status": u.status,
                "created_at": str(u.id),  # approximate — we'll use id as proxy
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
