"""
ASGI config for collaborative_text_editor project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/3.1/howto/deployment/asgi/
"""

import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from api.middleware import JWTAuthMiddleware
import api.routing


os.environ.setdefault('DJANGO_SETTINGS_MODULE',
                      'collaborative_text_editor.settings')

application = ProtocolTypeRouter({
    'http': get_asgi_application(),
    'websocket': JWTAuthMiddleware(
        URLRouter(
            api.routing.websocket_urlpatterns,
        )
    )
})
