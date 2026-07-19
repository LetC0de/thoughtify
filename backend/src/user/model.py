from sqlalchemy import Column, Integer, String
from src.utils.db import base


class UserModel(base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    name = Column(String)
    username = Column(String, nullable=False)
    password = Column(String, nullable=False)
    email = Column(String)