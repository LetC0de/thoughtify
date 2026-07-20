from src.thoughts.schema import thought_schema
from sqlalchemy.orm import Session
from src.thoughts.model import thought_model
from fastapi import HTTPException
from src.user.model import UserModel

def create_thought(body: thought_schema,db:Session,user: UserModel):

    data = body.model_dump()

    new_thought = thought_model(title=data["title"],
                                content=data["content"],
                                user_id=user.id)

    db.add(new_thought)
    db.commit()
    db.refresh(new_thought)


    return new_thought



def get_all_thought(db:Session,user: UserModel):
    thoughts = db.query(thought_model).filter(thought_model.user_id == user.id).all()
    return thoughts



def update_thought(body: thought_schema,thought_id:int,db:Session,user: UserModel):

    thought: thought_model = db.query(thought_model).get(thought_id)

    if not thought:
        raise HTTPException(status_code=404,detail="Thought not found")

    if thought.user_id != user.id:
        raise HTTPException(status_code=401,detail="Unauthorized to update thought")
    

    body = body.model_dump()
    for field,value in body.items():
        setattr(thought,field,value)

    db.add(thought)
    db.commit()
    db.refresh(thought)

    return thought




def delete_thought(thought_id:int,db:Session,user: UserModel):
    thought: thought_model = db.query(thought_model).get(thought_id)

    if not thought:
        raise HTTPException(status_code=404,detail="Thought not found")

    if thought.user_id != user.id:
        raise HTTPException(status_code=401,detail="Unauthorized to delete thought")

    db.delete(thought)
    db.commit()

    return {"message":"Thought deleted Successfully"}