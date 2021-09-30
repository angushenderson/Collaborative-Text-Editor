from datetime import datetime, timezone
from django.core.exceptions import ObjectDoesNotExist
from channels.db import database_sync_to_async
from authentication.models import User


@database_sync_to_async
def get_user(authentication_ticket: str) -> User:
    """ Get the user associated with a given authentication_ticket """
    try:
        user: User = User.objects.get(
            authentication_ticket=authentication_ticket)
        if datetime.now(tz=timezone.utc) < user.authentication_ticket_expires_at:
            return user
    except ObjectDoesNotExist:
        return None


class JWTAuthMiddleware:
    """ Custom Middleware class for wrapping django rest framework simple jwt authentication """

    def __init__(self, app):
        # Store the ASGI application we were passed
        self.app = app

    async def __call__(self, scope, receive, send):
        """ Lookup user and add to scope """
        scope['user'] = await get_user(scope["query_string"].decode('utf-8'))
        return await self.app(scope, receive, send)
