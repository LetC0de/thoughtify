from sqlalchemy import Column, Integer, String, DateTime, Boolean
from datetime import datetime, timezone
from src.utils.db import base


class PasswordResetToken(base):
    __tablename__ = "password_reset_tokens"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, nullable=False, index=True)
    token_hash = Column(String, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    used = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
