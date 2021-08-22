import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from api.models import Document


class DocumentConsumer(AsyncWebsocketConsumer):
    """
    Consumer to handle collaborative document editing, along with
    'saveless' editing (user doesn't need to spam Ctrl+S)
    """

    async def connect(self) -> None:
        """ Run when websocket connection established """
        # self.document_id = self.scope['url_route']['kwargs']['document_id']
        self.document = await self.get_document(
            '14776d62-411d-421c-b60a-548d5434e403')
        await self.accept()
        print(f'CONNECTED ---> {self.document}')

    async def disconnect(self, close_code) -> None:
        """ Run when websocket connection terminates """
        print('DISCONNECTED')

    async def receive(self, text_data) -> None:
        """ Run when server websocket receives data from client """
        data = json.loads(text_data)
        # Currently just echo back the request
        await self.update_document_title(**data)
        await self.send(text_data=json.dumps(data))

    @database_sync_to_async
    def get_document(self, id: str) -> Document:
        return Document.objects.get(id=id)

    @database_sync_to_async
    def update_document_title(self, text: str) -> None:
        """
        Function to update document title with request text
        """
        self.document.title = text
        self.document.save(update_fields=['title'])
