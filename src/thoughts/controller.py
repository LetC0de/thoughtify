from src.thoughts.schema import thought_schema

def create_thought(body: thought_schema):
    print(body.model_dump())
    return {"message": "Thought created Successfully"}