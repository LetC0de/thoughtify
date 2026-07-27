from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from src.utils.db import get_db
from src.admin import controller
from src.admin.schema import AdminLoginRequest

admin_router = APIRouter(prefix="/admin", tags=["Admin"])


# ── Auth ──

@admin_router.post("/login")
def login(body: AdminLoginRequest, db: Session = Depends(get_db)):
    return controller.login_admin(body.email, body.password, db)


@admin_router.get("/me")
def me(admin=Depends(controller.require_admin)):
    return controller.get_admin_profile(admin)


# ── Dashboard ──

@admin_router.get("/dashboard")
def dashboard(
    admin=Depends(controller.require_admin),
    db: Session = Depends(get_db),
):
    return controller.get_dashboard_stats(db)


# ── Users ──

@admin_router.get("/users/active")
def list_active_users(
    search: str = Query("", max_length=100),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    admin=Depends(controller.require_admin),
    db: Session = Depends(get_db),
):
    return controller.get_active_users(db, search, page, limit)


@admin_router.get("/users")
def list_users(
    search: str = Query("", max_length=100),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    admin=Depends(controller.require_admin),
    db: Session = Depends(get_db),
):
    return controller.list_users(db, search, page, limit)


@admin_router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    admin=Depends(controller.require_admin),
    db: Session = Depends(get_db),
):
    return controller.delete_user(user_id, db)


# ── Posts ──

@admin_router.get("/posts")
def list_posts(
    search: str = Query("", max_length=100),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    admin=Depends(controller.require_admin),
    db: Session = Depends(get_db),
):
    return controller.list_posts(db, search, page, limit)


@admin_router.get("/posts/{post_id}")
def get_post(
    post_id: int,
    admin=Depends(controller.require_admin),
    db: Session = Depends(get_db),
):
    return controller.get_post_detail(post_id, db)


@admin_router.delete("/posts/{post_id}")
def delete_post(
    post_id: int,
    admin=Depends(controller.require_admin),
    db: Session = Depends(get_db),
):
    return controller.delete_post(post_id, db)


# ── Comments ──

@admin_router.get("/comments")
def list_comments(
    search: str = Query("", max_length=100),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    admin=Depends(controller.require_admin),
    db: Session = Depends(get_db),
):
    return controller.list_comments(db, search, page, limit)


@admin_router.delete("/comments/{comment_id}")
def delete_comment(
    comment_id: int,
    admin=Depends(controller.require_admin),
    db: Session = Depends(get_db),
):
    return controller.delete_comment(comment_id, db)
