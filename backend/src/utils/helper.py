from fastapi import Request, HTTPException, status, Depends
from src.utils.settings import settings
from sqlalchemy.orm import Session
from src.user.model import UserModel
from jwt.exceptions import InvalidTokenError
from src.utils.db import get_db
import jwt




def is_authenticated(request:Request, db:Session = Depends(get_db)):
    try:
        token = request.headers.get("authorization")

        if not token:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token not found")
        
        token =token.split(" ")[-1]

        data = jwt.decode(token, settings.SECRET_KEY, settings.ALGORITHM)
        user_id = data.get("_id")

        user = db.query(UserModel).filter(UserModel.id == user_id).first()

        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

        return user
    except InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Token")