from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.routes.auth_routes import router as auth_router
from backend.routes.model_routes import router as model_router
from backend.routes.neo4j_routes import router as neo4j_router
from backend.routes.chat_routes import router as chat_router


def create_app() -> FastAPI:
    app = FastAPI(title="RAGQnASystem API", version="0.1.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health")
    def health_check():
        return {"status": "ok"}

    @app.get("/")
    def root():
        return {"status": "ok", "message": "RAGQnASystem API"}

    @app.get("/favicon.ico")
    def favicon():
        return Response(status_code=204)

    app.include_router(auth_router)
    app.include_router(model_router)
    app.include_router(neo4j_router)
    app.include_router(chat_router)

    return app


app = create_app()
