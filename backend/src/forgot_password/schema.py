from pydantic import BaseModel


class ForgotPasswordRequest(BaseModel):
    email: str


class VerifyResetOTPRequest(BaseModel):
    email: str
    otp: str


class ResetPasswordRequest(BaseModel):
    reset_token: str
    new_password: str


class ForgotPasswordResponse(BaseModel):
    message: str
    success: bool = True
    email_found: bool = False


class VerifyResetOTPResponse(BaseModel):
    message: str
    reset_token: str
    success: bool = True


class ResetPasswordResponse(BaseModel):
    message: str
    success: bool = True
