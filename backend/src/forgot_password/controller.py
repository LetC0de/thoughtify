import secrets
import hashlib
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from pwdlib import PasswordHash

from src.user.model import UserModel
from src.otp.model import EmailVerification
from src.forgot_password.model import PasswordResetToken

password_hash = PasswordHash.recommended()


# ── Helpers ──

def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def _generate_token() -> str:
    return secrets.token_urlsafe(48)


# ── Forgot Password (Step 1) ──

def forgot_password(email: str, db: Session):
    """Trigger OTP for password reset — always return success regardless."""
    user = db.query(UserModel).filter(UserModel.email == email).first()
    if not user:
        return {"message": "If this email exists, an OTP has been sent.", "success": True}

    last = (
        db.query(EmailVerification)
        .filter(EmailVerification.email == email, EmailVerification.purpose == "FORGOT_PASSWORD")
        .order_by(EmailVerification.created_at.desc())
        .first()
    )
    if last:
        cooldown = (datetime.now(timezone.utc) - last.created_at).total_seconds()
        if cooldown < 60:
            raise HTTPException(status_code=429, detail=f"Please wait {60 - int(cooldown)}s")

    otp = str(secrets.randbelow(900000) + 100000)
    otp_hash = hashlib.sha256(otp.encode()).hexdigest()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)

    db.add(EmailVerification(
        email=email,
        otp_hash=otp_hash,
        purpose="FORGOT_PASSWORD",
        expires_at=expires_at,
    ))
    db.commit()

    # Send email with OTP
    from src.utils.mail import _send_email, otp_email_html
    _send_email(email, "Password Reset — FreeSpeak", otp_email_html(otp))

    return {"message": "If this email exists, an OTP has been sent.", "success": True}


# ── Verify Reset OTP (Step 2) ──

def verify_reset_otp(email: str, otp: str, db: Session):
    """Verify OTP for forgot password and return a temporary reset token."""
    user = db.query(UserModel).filter(UserModel.email == email).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid request")

    record = (
        db.query(EmailVerification)
        .filter(
            EmailVerification.email == email,
            EmailVerification.purpose == "FORGOT_PASSWORD",
            EmailVerification.verified == False,
        )
        .order_by(EmailVerification.created_at.desc())
        .first()
    )
    if not record:
        raise HTTPException(status_code=400, detail="No OTP found. Request a new one.")
    if datetime.now(timezone.utc) > record.expires_at:
        raise HTTPException(status_code=400, detail="OTP expired. Request a new one.")
    if record.attempts >= 3:
        raise HTTPException(status_code=400, detail="Too many attempts. Request a new OTP.")

    otp_hash = hashlib.sha256(otp.encode()).hexdigest()
    if record.otp_hash != otp_hash:
        record.attempts += 1
        db.commit()
        remaining = 3 - record.attempts
        raise HTTPException(
            status_code=400,
            detail=f"Invalid OTP. {remaining} attempt{'s' if remaining != 1 else ''} left.",
        )

    # Mark OTP as verified
    record.verified = True
    db.commit()

    # Generate a temporary reset token (valid 10 minutes)
    reset_token = _generate_token()
    token_hash = _hash_token(reset_token)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)

    db.add(PasswordResetToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=expires_at,
    ))
    db.commit()

    return {"message": "OTP verified", "reset_token": reset_token, "success": True}


# ── Reset Password (Step 3) ──

def reset_password(reset_token: str, new_password: str, db: Session):
    """Reset password using a valid reset token."""
    token_hash = _hash_token(reset_token)

    record = (
        db.query(PasswordResetToken)
        .filter(
            PasswordResetToken.token_hash == token_hash,
            PasswordResetToken.used == False,
        )
        .order_by(PasswordResetToken.created_at.desc())
        .first()
    )
    if not record:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token.")
    if datetime.now(timezone.utc) > record.expires_at:
        raise HTTPException(status_code=400, detail="Reset token expired. Request a new one.")

    user = db.query(UserModel).filter(UserModel.id == record.user_id).first()
    if not user:
        raise HTTPException(status_code=400, detail="User not found.")

    # Update password
    user.password = password_hash.hash(new_password)
    record.used = True
    db.commit()

    return {"message": "Password reset successfully", "success": True}
