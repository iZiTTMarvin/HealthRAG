from fastapi import APIRouter
from pydantic import BaseModel

from backend.services.auth_service import AuthService


router = APIRouter(prefix="/api/auth", tags=["auth"])
auth_service = AuthService()


class LoginRequest(BaseModel):
    username: str
    password: str


class RegisterRequest(BaseModel):
    username: str
    password: str


@router.post("/login")
def login(payload: LoginRequest):
    return auth_service.login(payload.username, payload.password)


@router.post("/register")
def register(payload: RegisterRequest):
    return auth_service.register(payload.username, payload.password)
