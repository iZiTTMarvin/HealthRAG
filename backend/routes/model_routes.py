from fastapi import APIRouter

from backend.services.model_service import ModelService


router = APIRouter(prefix="/api/models", tags=["models"])
model_service = ModelService()


@router.get("")
def list_models():
    return model_service.get_available_models()
