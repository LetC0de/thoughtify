from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from src.utils.db import get_db
from src.otp.schema import SendOTPRequest, VerifyOTPRequest, OTPResponse
from src.otp import controller

otp_router = APIRouter(prefix="/auth")


@otp_router.post("/send-otp", response_model=OTPResponse, status_code=status.HTTP_200_OK)
def send_otp(body: SendOTPRequest, db: Session = Depends(get_db)):
    return controller.send_otp(body.email.strip().lower(), db)


@otp_router.post("/verify-otp", response_model=OTPResponse, status_code=status.HTTP_200_OK)
def verify_otp(body: VerifyOTPRequest, db: Session = Depends(get_db)):
    return controller.verify_otp(body.email.strip().lower(), body.otp.strip(), db)
