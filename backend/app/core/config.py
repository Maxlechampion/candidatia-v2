"""
Configuration centralisee de l application.
Toutes les variables d environnement sont typees et validees ici.
"""

from functools import lru_cache
from typing import List, Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuration globale, chargee depuis .env ou variables d environnement."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ---------- General ----------
    app_name: str = "CandidatIA"
    app_env: Literal["development", "staging", "production"] = "development"
    app_debug: bool = True
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    app_base_url: str = "http://localhost:8000"
    frontend_url: str = "http://localhost:3000"
    # Stockee en string CSV (ex: "https://a.com,https://b.com")
    # pour eviter le parsing JSON automatique de Pydantic Settings.
    allowed_origins: str = ""

    # ---------- Securite ----------
    secret_key: str = Field(..., min_length=16)
    jwt_algorithm: str = "HS256"
    jwt_expiration_minutes: int = 60

    # ---------- IA Providers ----------
    groq_api_key: str = ""
    gemini_api_key: str = ""
    mistral_api_key: str = ""
    cohere_api_key: str = ""

    ai_provider_order: str = "groq,gemini,mistral,cohere"
    ai_timeout_seconds: int = 60
    ai_max_retries: int = 2
    ai_circuit_breaker_threshold: int = 3
    ai_circuit_breaker_cooldown: int = 300

    # ---------- Supabase ----------
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_key: str = ""
    database_url: str = ""

    # ---------- Redis ----------
    redis_url: str = "redis://localhost:6379"
    upstash_redis_url: str = ""
    upstash_redis_token: str = ""

    # ---------- Brevo ----------
    brevo_api_key: str = ""
    brevo_sender_email: str = "noreply@candidatia.com"
    brevo_sender_name: str = "CandidatIA"

    # ---------- FedaPay ----------
    fedapay_secret_key: str = ""
    fedapay_public_key: str = ""
    fedapay_env: Literal["sandbox", "live"] = "sandbox"
    fedapay_webhook_secret: str = ""

    # ---------- Flutterwave ----------
    flutterwave_secret_key: str = ""
    flutterwave_public_key: str = ""
    flutterwave_webhook_secret: str = ""

    # ---------- Raenest ----------
    raenest_api_key: str = ""
    raenest_webhook_secret: str = ""

    # ---------- Stockage ----------
    storage_provider: Literal["local", "supabase"] = "local"
    supabase_storage_bucket: str = "candidatia-packs"
    local_storage_path: str = "./fichiers_generes"
    max_file_size_mb: int = 10

    # ---------- Observabilite ----------
    sentry_dsn: str = ""
    log_level: str = "INFO"

    # ---------- Quotas ----------
    quota_free_monthly: int = 1
    quota_essentiel_total: int = 5
    quota_pro_monthly: int = 30

    # ---------- Proprietes calculees ----------
    @property
    def ai_providers_list(self) -> List[str]:
        return [p.strip().lower() for p in self.ai_provider_order.split(",") if p.strip()]

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"

    @property
    def is_development(self) -> bool:
        return self.app_env == "development"

    @property
    def cors_origins(self) -> List[str]:
        """Liste des origines CORS autorisees (frontend + extras CSV)."""
        origins = {self.frontend_url}
        if self.allowed_origins:
            for origin in self.allowed_origins.split(","):
                origin = origin.strip()
                if origin:
                    origins.add(origin)
        return sorted(origins)

    # ---------- Validators ----------
    @field_validator("secret_key")
    @classmethod
    def validate_secret_key(cls, v: str) -> str:
        if len(v) < 16:
            raise ValueError("SECRET_KEY doit faire au moins 16 caracteres")
        return v


@lru_cache
def get_settings() -> Settings:
    """Singleton de configuration."""
    return Settings()  # type: ignore[call-arg]