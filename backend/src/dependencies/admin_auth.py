from fastapi import Request, HTTPException, status, Depends
from sqlalchemy.orm import Session
from src.utils.db import get_db
from src.utils.helper import is_authenticated
from src.user.model import UserModel


def require_admin(
    user: UserModel = Depends(is_authenticated),
) -> UserModel:
    """Dependency that verifies the authenticated user has ADMIN role."""
    if user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    if user.status == "banned":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is banned",
        )
    return user
