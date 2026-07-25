from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from pydantic import BaseModel
import jwt

from src.utils.db import get_db
from src.utils.settings import settings
from src.user.model import UserModel
from src.dependencies.admin_auth import require_admin
from pwdlib import PasswordHash

password_hash = PasswordHash.recommended()

router = APIRouter(prefix="/admin", tags=["Admin Auth"])


# ── Schemas ──
class AdminLoginRequest(BaseModel):
    email: str
    password: str


class AdminLoginResponse(BaseModel):
    token: str
    user: dict


class AdminMeResponse(BaseModel):
    id: int
    username: str
    email: str
    name: str | None
    role: str
    status: str


# ── Endpoints ──
@router.post("/login")
def admin_login(body: AdminLoginRequest, db: Session = Depends(get_db)):
    user = db.query(UserModel).filter(UserModel.email == body.email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Not an admin account")

    if user.status == "banned":
        raise HTTPException(status_code=403, detail="Account is banned")

    if not password_hash.verify(body.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    exp_time = datetime.now() + timedelta(hours=24)
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
            "status": user.status,
        },
    }


@router.get("/me")
def admin_me(admin: UserModel = Depends(require_admin)):
    return {
        "id": admin.id,
        "username": admin.username,
        "email": admin.email,
        "name": admin.name,
        "role": admin.role,
        "status": admin.status,
    }
