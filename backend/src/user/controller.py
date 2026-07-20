from sqlalchemy.orm import Session
from src.user.schema import UserSchema
from fastapi import HTTPException
from pwdlib import PasswordHash


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