"""Point d entree FastAPI de CandidatIA."""

from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import get_settings
from app.core.errors import AppError
from app.core.logging import get_logger, setup_logging
from app.core.telemetry import setup_sentry
from app.routers import health, ingestion, generation, auth, generations, quota, billing, webhooks, relance, scheduler


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()
    setup_logging(settings.log_level, settings.is_production)
    setup_sentry()

    logger = get_logger("startup")
    logger.info(
        "app_starting",
        app_name=settings.app_name,
        env=settings.app_env,
        debug=settings.app_debug,
    )

    yield

    logger.info("app_stopping", app_name=settings.app_name)


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title=settings.app_name,
        description=(
            "API de generation de packs de candidature IA "
            "(CV methode STAR + Lettre + Guide d entretien + Relance)."
        ),
        version="0.1.0",
        docs_url="/docs" if not settings.is_production else None,
        redoc_url="/redoc" if not settings.is_production else None,
        openapi_url="/openapi.json" if not settings.is_production else None,
        lifespan=lifespan,
    )

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["*"],
    )

    # Handlers d erreurs
    @app.exception_handler(AppError)
    async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
        logger = get_logger("error")
        logger.warning(
            "app_error",
            error_code=exc.error_code,
            message=exc.message,
            path=str(request.url),
            details=exc.details,
        )
        return JSONResponse(status_code=exc.status_code, content=exc.to_dict())

    @app.exception_handler(Exception)
    async def generic_error_handler(request: Request, exc: Exception) -> JSONResponse:
        logger = get_logger("error")
        logger.exception(
            "unhandled_error",
            path=str(request.url),
            error=str(exc),
        )
        return JSONResponse(
            status_code=500,
            content={
                "error_code": "INTERNAL_ERROR",
                "message": "Une erreur interne est survenue.",
                "details": {},
            },
        )

    # Routers
    app.include_router(health.router)

    app.include_router(ingestion.router)


    app.include_router(generation.router)



    app.include_router(auth.router)




    app.include_router(generations.router)





    app.include_router(quota.router)






    app.include_router(billing.router)







    app.include_router(webhooks.router)








    app.include_router(relance.router)









    app.include_router(scheduler.router)
    

    return app


app = create_app()
