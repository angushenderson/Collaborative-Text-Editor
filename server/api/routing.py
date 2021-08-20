from django.urls import re_path
from api.consumers import DocumentConsumer


websocket_urlpatterns = [
    re_path(r'ws/document/', DocumentConsumer.as_asgi()),
]
