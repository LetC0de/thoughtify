from fastapi import APIRouter
from src.thoughts import controller

thought_router = APIRouter(prefix="/thought")


@thought_router.post("/create")
def create_thought():
    return controller.create_thought()