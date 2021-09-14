from django.urls import path
from api.consumers import DocumentConsumer


websocket_urlpatterns = [
    path('ws/document/<str:document_id>/', DocumentConsumer.as_asgi()),
]
