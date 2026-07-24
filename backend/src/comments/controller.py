from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException
from src.thoughts.model import thought_model, CommentModel
from src.user.model import UserModel
from src.comments.schema import CommentCreate, CommentResponse


def _comment_to_response(comment: CommentModel) -> CommentResponse:
    """Convert a CommentModel to CommentResponse schema."""
    content = comment.content
    if comment.is_deleted:
        content = "[This comment has been deleted]"

    author_name = comment.author.name if comment.author else ""
    author_username = comment.author.username if comment.author else ""

    return CommentResponse(
        id=comment.id,
        thought_id=comment.thought_id,
        user_id=comment.user_id,
        parent_comment_id=comment.parent_comment_id,
        content=content,
        likes_count=comment.likes_count or 0,
        reply_count=comment.reply_count or 0,
        is_edited=bool(comment.is_edited),
        is_deleted=bool(comment.is_deleted),
        created_at=comment.created_at,
        updated_at=comment.updated_at,
        author_name=author_name,
        author_username=author_username,
        replies=[],
    )


def create_comment(thought_id: int, body: CommentCreate, db: Session, user: UserModel) -> CommentResponse:
    # Validate thought exists
    thought = db.query(thought_model).filter(thought_model.id == thought_id).first()
    if not thought:
        raise HTTPException(status_code=404, detail="Thought not found")

    # If replying, validate parent comment exists
    if body.parent_comment_id:
        parent = db.query(CommentModel).filter(CommentModel.id == body.parent_comment_id).first()
        if not parent:
            raise HTTPException(status_code=404, detail="Parent comment not found")

    comment = CommentModel(
        thought_id=thought_id,
        user_id=user.id,
        parent_comment_id=body.parent_comment_id,
        content=body.content,
    )
    db.add(comment)

    # Increment reply_count on parent if it's a reply
    if body.parent_comment_id:
        parent = db.query(CommentModel).get(body.parent_comment_id)
        if parent:
            parent.reply_count = (parent.reply_count or 0) + 1

    db.commit()
    db.refresh(comment)

    # Eager load author
    db.refresh(comment, attribute_names=["author"])
    return _comment_to_response(comment)


def get_comments(thought_id: int, db: Session) -> List[CommentResponse]:
    """Return all comments for a thought as a nested tree."""
    # Validate thought exists
    thought = db.query(thought_model).filter(thought_model.id == thought_id).first()
    if not thought:
        raise HTTPException(status_code=404, detail="Thought not found")

    # Get all comments for this thought with author loaded
    comments = (
        db.query(CommentModel)
        .options(joinedload(CommentModel.author))
        .filter(CommentModel.thought_id == thought_id)
        .order_by(CommentModel.created_at.asc())
        .all()
    )

    # Build a map: id -> CommentResponse
    comment_map: dict[int, CommentResponse] = {}
    root_comments: List[CommentResponse] = []

    for c in comments:
        cr = _comment_to_response(c)
        comment_map[c.id] = cr

    # Build tree
    for c in comments:
        cr = comment_map[c.id]
        if c.parent_comment_id and c.parent_comment_id in comment_map:
            parent = comment_map[c.parent_comment_id]
            parent.replies.append(cr)
        else:
            root_comments.append(cr)

    return root_comments


def delete_comment(comment_id: int, db: Session, user: UserModel):
    comment = db.query(CommentModel).filter(CommentModel.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this comment")

    # Soft delete — keep the tree intact
    comment.is_deleted = True
    comment.content = ""
    db.commit()
    return {"message": "Comment deleted"}
