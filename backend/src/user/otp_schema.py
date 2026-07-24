from pydantic import BaseModel, EmailStr


class SendOTPRequest(BaseModel):
    email: str


class VerifyOTPRequest(BaseModel):
    email: str
    otp: str


class OTPResponse(BaseModel):
    message: str
    success: bool = True
