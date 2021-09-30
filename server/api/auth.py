from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, AuthenticationFailed
# from channels.db import database_sync_to_async
from authentication.models import User


def is_token_valid(access_token: str, user: User) -> bool:
    """ Given a JWT determine wether its valid and matches a given user object (for a current WebSocket session) """
    authenticator = JWTAuthentication()

    try:
        validated_token = authenticator.get_validated_token(access_token)
        return get_token_user(validated_token) == user
    except InvalidToken:
        print("INVALID TOKEN")
        return False


def get_token_user(validated_token) -> User:
    """ Given a validated token, return a given user. None returned if user doesn't exist or token is invalid """
    authenticator = JWTAuthentication()

    try:
        return authenticator.get_user(validated_token)
    except InvalidToken:
        return None
    except AuthenticationFailed:
        return None
