"""
Cache Redis pour les reponses IA.

Evite de re-solliciter les providers pour des prompts identiques.
Gain estime : 40-60% des appels en production.
"""

import hashlib
import json
from typing import Any, Dict, Optional

from app.core.config import get_settings
from app.core.logging import get_logger

logger = get_logger("ai.cache")

try:
    import redis as redis_sync
    _REDIS_AVAILABLE = True
except ImportError:
    _REDIS_AVAILABLE = False


class AICache:
    """Cache cle-valeur pour les reponses IA."""

    DEFAULT_TTL = 60 * 60 * 24  # 24h

    def __init__(self) -> None:
        self.settings = get_settings()
        self._client = None

    def _get_client(self):
        if not _REDIS_AVAILABLE:
            return None

        if self._client is None:
            try:
                self._client = redis_sync.from_url(
                    self.settings.redis_url,
                    decode_responses=True,
                    socket_timeout=2,
                )
                self._client.ping()
            except Exception as e:
                logger.warning("redis_unavailable", error=str(e))
                self._client = None

        return self._client

    @staticmethod
    def make_key(system_prompt: str, user_prompt: str) -> str:
        """Genere une cle de cache deterministe."""
        payload = f"{system_prompt}\n---\n{user_prompt}"
        return "ai:" + hashlib.sha256(payload.encode("utf-8")).hexdigest()

    def get(self, key: str) -> Optional[Dict[str, Any]]:
        """Recupere une reponse en cache ou None."""
        client = self._get_client()
        if not client:
            return None

        try:
            data = client.get(key)
            if data:
                logger.info("cache_hit", key=key[:16])
                return json.loads(data)
        except Exception as e:
            logger.warning("cache_get_error", error=str(e))

        return None

    def set(
        self,
        key: str,
        value: Dict[str, Any],
        ttl: int = DEFAULT_TTL,
    ) -> None:
        """Stocke une reponse en cache."""
        client = self._get_client()
        if not client:
            return

        try:
            client.setex(key, ttl, json.dumps(value))
        except Exception as e:
            logger.warning("cache_set_error", error=str(e))


# Singleton
_cache_instance: Optional[AICache] = None


def get_cache() -> AICache:
    global _cache_instance
    if _cache_instance is None:
        _cache_instance = AICache()
    return _cache_instance
