from pydantic import BaseModel


class userSchema(BaseModel):
    name : str
    username : str
    password : str
    email : str
    