from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from settings import settings
from routers import configs, calls, retell


def create_app() -> FastAPI:
    app = FastAPI(title="AI Voice Agent Backend", version="0.1.0")

    # CORS for local dev and deploy base URL
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(configs.router, prefix="/api/configs", tags=["configs"])
    app.include_router(calls.router, prefix="/api/calls", tags=["calls"])
    app.include_router(retell.router, prefix="/api/webhook", tags=["webhook"])

    @app.get("/health")
    def health() -> dict:
        return {"status": "ok"}

    return app


app = create_app()


