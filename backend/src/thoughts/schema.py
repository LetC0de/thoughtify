from pydantic import BaseModel


class thought_schema(BaseModel):

    title : str
    content : str


class thought_response_schema(BaseModel):

    id : int
    title : str
    content : str