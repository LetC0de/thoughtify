from pydantic import BaseModel


class thought_schema(BaseModel):

    title : str
    content : str