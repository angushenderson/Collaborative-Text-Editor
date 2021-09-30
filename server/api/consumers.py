import json
from django.core.exceptions import ObjectDoesNotExist
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from api.models import Document, ContentBlock, InlineStyle
from api.serializers import *

# TODO: Once REDIS is set up, look at loading document object and all children into this to reduce lookup times in main database
#        then drip feed updates back in every few minutes and leave redis when all websocket's close. Make super fast!!


class DocumentConsumer(AsyncWebsocketConsumer):
    """
    Consumer to handle collaborative document editing, along with
    'saveless' editing (user doesn't need to spam Ctrl+S)
    """
    METHOD_SERIALIZERS = {
        'insert': InsertDocumentContentSerializer,
        'delete': DeleteDocumentContentSerializer,
        'split-block': SplitContentBlockSerializer,
        'set-block-type': SetContentBlockTypeSerializer,
        'set-inline-style': SetInlineStyleSerializer,
        # This exists solely for base error catching/handling
        '': BaseDocumentUpdateContentSerializer,
    }

    async def connect(self) -> None:
        """ Run when websocket connection established """
        self.document_id: str = self.scope['url_route']['kwargs']['document_id']
        try:
            self.document: Document = await self.get_document(self.document_id)
            await self.accept()
            print(f'CONNECTED --> {self.scope["user"]}')
        except ObjectDoesNotExist:
            pass

    async def disconnect(self, close_code) -> None:
        """ Run when websocket connection terminates """
        print('DISCONNECTED')

    async def receive(self, text_data) -> None:
        """ Run when server websocket receives data from client """
        serializer = WebSocketMessageSerializer(data=json.loads(text_data))

        if serializer.is_valid():
            type: str = serializer.validated_data['type']
            body: dict = serializer.validated_data['body']

            if type == 'update-document-content':
                serializers = await self.document_update_type(body)
                for serializer in serializers:
                    await self.update_document_content(serializer)
                await self.send(text_data)

            elif type == 'update-document-title':
                title_serializer = UpdateDocumentTitleSerializer(data=body)

                if title_serializer.is_valid():
                    await self.update_document_title(title_serializer)
                    await self.send(text_data=json.dumps(serializer.validated_data))

                else:
                    await self.raise_error()

        else:
            await self.raise_error()

    async def raise_error(self, errors: dict = None):
        # 1002 - data is flawed, throw all blame on the client lol
        print('ERRORS', errors)
        # self.close(code=1002)
        self.send(json.dumps(errors))

    async def document_update_type(self, data: dict) -> list[BaseDocumentUpdateContentSerializer]:
        """ Convert update message to specific update type serializer. If invalid, None is returned """
        # Generic parent serializer
        serializer = UpdateDocumentContentSerializer(data=data)
        serializers = []

        if serializer.is_valid():
            # Specific update type serializer
            for update in serializer.validated_data['data']:
                serializer = self.METHOD_SERIALIZERS.get(
                    update.get('type', ''))(data=update)
                if serializer.is_valid():
                    serializers.append(serializer)
                else:
                    await self.raise_error(serializer.errors)
        else:
            await self.raise_error(serializer.errors)
        return serializers

    @database_sync_to_async
    def get_document(self, id: str) -> Document:
        return Document.objects.get(id=id)

    @database_sync_to_async
    def update_document_title(self, serializer: UpdateDocumentTitleSerializer) -> None:
        """ Function to update document title with request text """
        serializer.save(self.document)

    @database_sync_to_async
    def update_document_content(self, serializer: BaseDocumentUpdateContentSerializer) -> None:
        """ Method to update the content of a document. """
        serializer.save(self.document)
