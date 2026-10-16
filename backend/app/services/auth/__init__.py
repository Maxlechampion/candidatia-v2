"""Services d authentification et de gestion utilisateurs."""

from app.services.auth.password import hash_password, verify_password
from app.services.auth.jwt_service import create_access_token, decode_access_token
from app.services.auth.user_service import (
    create_user,
    get_user_by_email,
    get_user_by_id,
    update_user,
    add_credits,
    consume_credit,
)
from app.services.auth.quota_service import check_quota, get_quota_info

__all__ = [
    "hash_password",
    "verify_password",
    "create_access_token",
    "decode_access_token",
    "create_user",
    "get_user_by_email",
    "get_user_by_id",
    "update_user",
    "add_credits",
    "consume_credit",
    "check_quota",
    "get_quota_info",
]
