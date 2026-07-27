from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from src.utils.db import get_db
from src.forgot_password.schema import (
    ForgotPasswordRequest,
    VerifyResetOTPRequest,
    ResetPasswordRequest,
    ForgotPasswordResponse,
    VerifyResetOTPResponse,
    ResetPasswordResponse,
)
from src.forgot_password import controller

forgot_password_router = APIRouter(prefix="/auth", tags=["Forgot Password"])


@forgot_password_router.post("/forgot-password", response_model=ForgotPasswordResponse, status_code=status.HTTP_200_OK)
def forgot_password(body: ForgotPasswordRequest, db: Session = Depends(get_db)):
    return controller.forgot_password(body.email.strip().lower(), db)


@forgot_password_router.post("/verify-reset-otp", response_model=VerifyResetOTPResponse, status_code=status.HTTP_200_OK)
def verify_reset_otp(body: VerifyResetOTPRequest, db: Session = Depends(get_db)):
    return controller.verify_reset_otp(body.email.strip().lower(), body.otp.strip(), db)


@forgot_password_router.post("/reset-password", response_model=ResetPasswordResponse, status_code=status.HTTP_200_OK)
def reset_password(body: ResetPasswordRequest, db: Session = Depends(get_db)):
    return controller.reset_password(body.reset_token.strip(), body.new_password, db)
