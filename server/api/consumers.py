import json
from django.core.exceptions import ObjectDoesNotExist
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from api.models import Document, ContentBlock, InlineStyle
from api.serializers import *
from authentication.models import User
from .auth import is_token_valid

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
    RESPONSE_KEYS = ('type', 'body')

    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)
        self._errors: list = []

    async def connect(self) -> None:
        """ Run when websocket connection established """
        self.document_id: str = self.scope['url_route']['kwargs']['document_id']
        try:
            self.document: Document = await self.get_document(self.document_id)
            self.user: User = self.scope['user']
            if self.is_user_contributor(self.user, self.document):
                await self.accept()
                print(f'CONNECTED --> {self.user}')
        except ObjectDoesNotExist:
            pass

    async def disconnect(self, close_code) -> None:
        """ Run when websocket connection terminates """
        print('DISCONNECTED')

    async def receive(self, text_data) -> None:
        """ Run when server websocket receives data from client """
        # TODO improve errors returned via websocket
        serializer = await self.load_message_serializer(text_data)
        response = json.loads(text_data)

        if serializer.is_valid():
            if await self.is_valid_access_token(serializer.validated_data['access_token']):
                type: str = serializer.validated_data['type']
                body: dict = serializer.validated_data['body']

                if type == 'update-document-content':
                    serializers = await self.document_update_type(body)
                    for serializer in serializers:
                        await self.update_document_content(serializer)

                elif type == 'update-document-title':
                    title_serializer = UpdateDocumentTitleSerializer(data=body)
                    if title_serializer.is_valid():
                        await self.update_document_title(title_serializer)
                    else:
                        await self.raise_error(serializer.errors)

                # TODO Streamline these methods into a single switch like condition
                elif type == 'add-new-collaborator':
                    body['document'] = str(self.document.id)
                    serializer = await self.create_document_collaborator_serializer(body)
                    if await self.is_serializer_valid(serializer):
                        await self.add_new_document_collaborator(serializer)
                        response['body'] = await self.serializer_data(serializer)
                    else:
                        await self.raise_error(serializer.errors)
            else:
                await self.raise_error({"access_token": "Invalid access token"})
        else:
            await self.raise_error()

        # print(type(text_data))
        print(response)
        await self.send_response(response)

    async def raise_error(self, errors: dict = None):
        # 1002 - data is flawed, throw all blame on the client lol
        print('ERRORS', errors)
        self._errors += errors
        # self.close(code=1002)
        # self.send(json.dumps(errors))

    async def send_response(self, text_data):
        print("RESPONSE")
        if self._errors:
            print(json.dumps(self._errors))
            await self.send(text_data=json.dumps({"errors": self._errors}))
            self._errors = []
        else:
            print(
                {key: text_data[key] for key in text_data.keys() if key in self.RESPONSE_KEYS})
            await self.send(text_data=json.dumps({key: text_data[key] for key in text_data.keys() if key in self.RESPONSE_KEYS}))

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

    async def is_valid_access_token(self, token):
        return await is_token_valid(token, self.scope['user'])

    @database_sync_to_async
    def load_message_serializer(self, text_data) -> WebSocketMessageSerializer:
        return WebSocketMessageSerializer(data=json.loads(text_data), context={'user': self.scope['user']})

    @database_sync_to_async
    def get_document(self, id: str) -> Document:
        return Document.objects.get(id=id)

    @database_sync_to_async
    def is_user_contributor(self, user: User, document: Document) -> bool:
        return user in document.collaborators.all()

    @database_sync_to_async
    def update_document_title(self, serializer: UpdateDocumentTitleSerializer) -> None:
        """ Function to update document title with request text """
        serializer.save(self.document)

    @database_sync_to_async
    def update_document_content(self, serializer: BaseDocumentUpdateContentSerializer) -> None:
        """ Method to update the content of a document. """
        serializer.save(self.document)

    @database_sync_to_async
    def add_new_document_collaborator(self, serializer: DocumentCollaboratorSerializer) -> None:
        """ Add a new document collaborator """
        serializer.save()

    @database_sync_to_async
    def create_document_collaborator_serializer(self, body: dict) -> DocumentCollaboratorSerializer:
        return DocumentCollaboratorSerializer(data=body)

    @database_sync_to_async
    def is_serializer_valid(self, serializer) -> bool:
        return serializer.is_valid()

    @database_sync_to_async
    def serializer_data(self, serializer) -> dict:
        return serializer.data
