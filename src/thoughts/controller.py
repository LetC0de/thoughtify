from src.thoughts.schema import thought_schema
from sqlalchemy.orm import Session
from src.thoughts.model import thought_model

def create_thought(body: thought_schema,db:Session):

    data = body.model_dump()

    new_thought = thought_model(title=data["title"],
                                content=data["content"])

    db.add(new_thought)
    db.commit()
    db.refresh(new_thought)


    return {"message": "Thought created Successfully","data":new_thought}