import secrets
import hashlib
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException
from sqlalchemy.orm import Session
from src.user.model import UserModel, EmailVerification
from src.utils.mail import _send_email, otp_email_html


def _hash_otp(otp: str) -> str:
    return hashlib.sha256(otp.encode()).hexdigest()


def _generate_otp() -> str:
    return str(secrets.randbelow(900000) + 100000)


def send_otp(email: str, db: Session):
    existing = db.query(UserModel).filter(UserModel.email == email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    last = (
        db.query(EmailVerification)
        .filter(EmailVerification.email == email)
        .order_by(EmailVerification.created_at.desc())
        .first()
    )
    if last:
        cooldown = (datetime.now(timezone.utc) - last.created_at).total_seconds()
        if cooldown < 60:
            raise HTTPException(status_code=429, detail=f"Please wait {60 - int(cooldown)}s")

    otp = _generate_otp()
    otp_hash = _hash_otp(otp)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)

    db.add(EmailVerification(email=email, otp_hash=otp_hash, expires_at=expires_at))
    db.commit()

    _send_email(email, "Your FreeSpeak Verification Code", otp_email_html(otp))
    return {"message": "OTP sent", "success": True}


def verify_otp(email: str, otp: str, db: Session):
    record = (
        db.query(EmailVerification)
        .filter(EmailVerification.email == email, EmailVerification.verified == False)
        .order_by(EmailVerification.created_at.desc())
        .first()
    )
    if not record:
        raise HTTPException(status_code=400, detail="No OTP found. Request a new one.")
    if datetime.now(timezone.utc) > record.expires_at:
        raise HTTPException(status_code=400, detail="OTP expired. Request a new one.")
    if record.attempts >= 3:
        raise HTTPException(status_code=400, detail="Too many attempts. Request a new OTP.")
    if record.otp_hash != _hash_otp(otp):
        record.attempts += 1
        db.commit()
        remaining = 3 - record.attempts
        raise HTTPException(status_code=400, detail=f"Invalid OTP. {remaining} attempt{'s' if remaining != 1 else ''} left.")

    record.verified = True
    db.commit()
    return {"message": "Email verified", "success": True}
