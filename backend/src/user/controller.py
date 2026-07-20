from src.user.schema import UserSchema, UserLoginSchema
from fastapi import HTTPException, status
from datetime import datetime, timedelta
from src.utils.settings import settings
from sqlalchemy.orm import Session
from pwdlib import PasswordHash
import jwt

password_hash = PasswordHash.recommended()


def get_password_hash(password):
    return password_hash.hash(password)


def register_user(body: UserSchema, db: Session):

    is_username_exists = db.query(UserSchema).filter(UserSchema.username == body.username).first()

    if is_username_exists:
        raise HTTPException(status_code=400, detail="Username already exists")


    is_email_exists = db.query(UserSchema).filter(UserSchema.email == body.email).first()

    if is_email_exists:
        raise HTTPException(status_code=400, detail="Email already exists")
    

    hashed_password = get_password_hash(body.password)

    new_user = UserSchema(
        name=body.name,
        username=body.username,
        password=hashed_password,
        email=body.email
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user



def login_user(body:UserLoginSchema, db:Session):

    user = db.query(UserSchema).filter(UserSchema.username == body.username).first()

    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    if not password_hash.verify(body.password, user.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect password")
    
    exp_time = datetime.now() + timedelta(minutes=settings.EXP_TIME)

    token = jwt.encode({
        "_id": user.id,
        "exp": exp_time.timestamp()
    }, settings.SECRET_KEY,settings.ALGORITHM)

    return {"token": token, "user": user}