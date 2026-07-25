from pydantic import BaseModel


class AdminLoginRequest(BaseModel):
    email: str
    password: str


class AdminLoginResponse(BaseModel):
    token: str
    user: dict


class AdminMeResponse(BaseModel):
    id: int
    username: str
    email: str
    name: str | None
    role: str
    status: str
