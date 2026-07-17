from fastapi import APIRouter
from src.thoughts import controller
from src.thoughts.schema import thought_schema

thought_router = APIRouter(prefix="/thought")


@thought_router.post("/create")
def create_thought(body:thought_schema):
    return controller.create_thought(body)