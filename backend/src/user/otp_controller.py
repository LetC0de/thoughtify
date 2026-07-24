import secrets
import hashlib
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from src.user.model import UserModel, EmailVerification
from src.utils.mail import send_otp_email


def _hash_otp(otp: str) -> str:
    return hashlib.sha256(otp.encode()).hexdigest()


def _generate_otp() -> str:
    return str(secrets.randbelow(900000) + 100000)  # 6-digit


def send_otp(email: str, bg_task: BackgroundTasks, db: Session):
    # Check if email already registered
    existing = db.query(UserModel).filter(UserModel.email == email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Check cooldown (60s)
    last = (
        db.query(EmailVerification)
        .filter(EmailVerification.email == email)
        .order_by(EmailVerification.created_at.desc())
        .first()
    )
    if last:
        cooldown = (datetime.now(timezone.utc) - last.created_at).total_seconds()
        if cooldown < 60:
            raise HTTPException(
                status_code=429,
                detail=f"Please wait {60 - int(cooldown)} seconds before requesting a new OTP",
            )

    # Generate OTP
    otp = _generate_otp()
    otp_hash = _hash_otp(otp)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)

    # Store
    verification = EmailVerification(
        email=email,
        otp_hash=otp_hash,
        expires_at=expires_at,
    )
    db.add(verification)
    db.commit()

    # Send email in background
    bg_task.add_task(send_otp_email, email, otp)

    return {"message": "OTP sent to your email", "success": True}


def verify_otp(email: str, otp: str, db: Session):
    # Find the latest unverified OTP for this email
    record = (
        db.query(EmailVerification)
        .filter(
            EmailVerification.email == email,
            EmailVerification.verified == False,
        )
        .order_by(EmailVerification.created_at.desc())
        .first()
    )

    if not record:
        raise HTTPException(status_code=400, detail="No OTP found. Please request a new one.")

    # Check expiry
    if datetime.now(timezone.utc) > record.expires_at:
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")

    # Check attempts (max 3)
    if record.attempts >= 3:
        raise HTTPException(status_code=400, detail="Too many failed attempts. Please request a new OTP.")

    # Verify
    if record.otp_hash != _hash_otp(otp):
        record.attempts += 1
        db.commit()
        remaining = 3 - record.attempts
        raise HTTPException(
            status_code=400,
            detail=f"Invalid OTP. {remaining} attempt{'s' if remaining != 1 else ''} remaining.",
        )

    # Mark verified
    record.verified = True
    db.commit()

    return {"message": "Email verified successfully", "success": True}
