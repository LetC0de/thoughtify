from sqlalchemy import Column, Integer, String, Boolean, DateTime
from datetime import datetime, timezone
from src.utils.db import base


class EmailVerification(base):
    __tablename__ = "email_verifications"

    id = Column(Integer, primary_key=True)
    email = Column(String, nullable=False, index=True)
    otp_hash = Column(String, nullable=False)
    purpose = Column(String, default="REGISTER")       # REGISTER | FORGOT_PASSWORD
    expires_at = Column(DateTime(timezone=True), nullable=False)
    verified = Column(Boolean, default=False)
    attempts = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
