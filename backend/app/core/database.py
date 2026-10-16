"""Helpers d acces a la base de donnees Supabase."""

from typing import Any, Dict, List, Optional

from app.core.errors import AppError
from app.core.logging import get_logger
from app.core.supabase_client import get_supabase_admin

logger = get_logger("core.database")


class DatabaseError(AppError):
    status_code = 500
    error_code = "DATABASE_ERROR"
    message = "Erreur de base de donnees."


def insert_row(table: str, data: Dict[str, Any]) -> Dict[str, Any]:
    """Insere une ligne et retourne la ligne creee."""
    try:
        client = get_supabase_admin()
        response = client.table(table).insert(data).execute()
        if not response.data:
            raise DatabaseError(message=f"Aucune donnee retournee pour {table}.")
        return response.data[0]
    except DatabaseError:
        raise
    except Exception as e:
        logger.exception("db_insert_error", table=table, error=str(e))
        raise DatabaseError(
            message=f"Erreur insert dans {table}.",
            details={"error": str(e)},
        ) from e


def select_rows(
    table: str,
    filters: Optional[Dict[str, Any]] = None,
    limit: Optional[int] = None,
    order_by: Optional[str] = None,
    descending: bool = True,
) -> List[Dict[str, Any]]:
    """Selectionne des lignes avec filtres optionnels."""
    try:
        client = get_supabase_admin()
        query = client.table(table).select("*")

        if filters:
            for key, value in filters.items():
                query = query.eq(key, value)

        if order_by:
            query = query.order(order_by, desc=descending)

        if limit:
            query = query.limit(limit)

        response = query.execute()
        return response.data or []
    except Exception as e:
        logger.exception("db_select_error", table=table, error=str(e))
        raise DatabaseError(
            message=f"Erreur select dans {table}.",
            details={"error": str(e)},
        ) from e


def select_one(
    table: str,
    filters: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    """Selectionne une seule ligne (ou None)."""
    rows = select_rows(table, filters=filters, limit=1)
    return rows[0] if rows else None


def update_row(
    table: str,
    filters: Dict[str, Any],
    data: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    """Met a jour des lignes et retourne la premiere mise a jour."""
    try:
        client = get_supabase_admin()
        query = client.table(table).update(data)

        for key, value in filters.items():
            query = query.eq(key, value)

        response = query.execute()
        return response.data[0] if response.data else None
    except Exception as e:
        logger.exception("db_update_error", table=table, error=str(e))
        raise DatabaseError(
            message=f"Erreur update dans {table}.",
            details={"error": str(e)},
        ) from e


def delete_row(table: str, filters: Dict[str, Any]) -> int:
    """Supprime des lignes. Retourne le nombre supprime."""
    try:
        client = get_supabase_admin()
        query = client.table(table).delete()

        for key, value in filters.items():
            query = query.eq(key, value)

        response = query.execute()
        return len(response.data) if response.data else 0
    except Exception as e:
        logger.exception("db_delete_error", table=table, error=str(e))
        raise DatabaseError(
            message=f"Erreur delete dans {table}.",
            details={"error": str(e)},
        ) from e


def health_check() -> bool:
    """Verifie la connexion a la DB."""
    try:
        client = get_supabase_admin()
        client.table("profiles").select("id").limit(1).execute()
        return True
    except Exception as e:
        logger.warning("db_health_check_failed", error=str(e))
        return False
