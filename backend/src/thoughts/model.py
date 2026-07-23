from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from src.utils.db import base


class thought_model(base):
    __tablename__ = "thoughts"

    id = Column(Integer, primary_key=True)
    title = Column(String)
    content = Column(String)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    likes_count = Column(Integer, default=0)

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))

    # Relationship to UserModel for eager loading
    author = relationship("UserModel", backref="thoughts")

    # Relationship to likes
    likes = relationship("LikeModel", backref="thought", cascade="all, delete-orphan")


class LikeModel(base):
    __tablename__ = "likes"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    thought_id = Column(Integer, ForeignKey("thoughts.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        UniqueConstraint("user_id", "thought_id", name="uq_user_thought_like"),
    )

    liker = relationship("UserModel")