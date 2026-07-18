from sqlalchemy import Column, Integer, String
from src.utils.db import base


class thought_model(base):
    __tablename__ = "thoughts"

    id = Column(Integer, primary_key=True)
    title = Column(String)
    content = Column(String)
    

    