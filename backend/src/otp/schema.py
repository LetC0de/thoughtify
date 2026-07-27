from pydantic import BaseModel


class SendOTPRequest(BaseModel):
    email: str
    purpose: str = "REGISTER"   # REGISTER | FORGOT_PASSWORD


class VerifyOTPRequest(BaseModel):
    email: str
    otp: str
    purpose: str = "REGISTER"   # REGISTER | FORGOT_PASSWORD


class OTPResponse(BaseModel):
    message: str
    success: bool = True
