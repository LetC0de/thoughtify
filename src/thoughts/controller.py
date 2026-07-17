from src.thoughts.schema import thought_schema
from sqlalchemy.orm import Session
from src.thoughts.model import thought_model
from fastapi import HTTPException

def create_thought(body: thought_schema,db:Session):

    data = body.model_dump()

    new_thought = thought_model(title=data["title"],
                                content=data["content"])

    db.add(new_thought)
    db.commit()
    db.refresh(new_thought)


    return {"message": "Thought created Successfully","data":new_thought}



def get_all_thought(db:Session):
    return db.query(thought_model).all()



def update_thought(body: thought_schema,thought_id:int,db:Session):

    thought = db.query(thought_model).get(thought_id)

    if not thought:
        raise HTTPException(status_code=404,detail="Thought not found")
    

    body = body.model_dump()
    for field,value in body.items():
        setattr(thought,field,value)

    db.add(thought)
    db.commit()
    db.refresh(thought)

    return thought