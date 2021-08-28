import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from api.models import Document, ContentBlock, InlineStyle


# TODO: Once REDIS is set up, look at loading document object and all children into this to reduce lookup times in main database
#        then drip feed updates back in every few minutes and leave redis when all websocket's close. Make super fast!!
class DocumentConsumer(AsyncWebsocketConsumer):
    """
    Consumer to handle collaborative document editing, along with
    'saveless' editing (user doesn't need to spam Ctrl+S)
    """

    async def connect(self) -> None:
        """ Run when websocket connection established """
        # self.document_id = self.scope['url_route']['kwargs']['document_id']
        self.document: Document = await self.get_document(
            'b50762e9-8f9b-4f80-8e31-4d7daf374d46')
        # self.document.content_blocks = await self.get_content_blocks()
        await self.accept()
        print(f'CONNECTED ---> {self.document}')

    async def disconnect(self, close_code) -> None:
        """ Run when websocket connection terminates """
        print('DISCONNECTED')

    async def receive(self, text_data) -> None:
        """ Run when server websocket receives data from client """
        data = json.loads(text_data)
        type: str = data.pop('type', None)

        if type == 'document-title':
            # Currently just echo back the request
            await self.update_document_title(**data)
            await self.send(text_data=json.dumps(data))

        elif type == 'document-update':
            # print(self.document.blocks.all())
            await self.update_document_content(**data['update_state'])
            await self.send(text_data=json.dumps({}))

    @database_sync_to_async
    def get_document(self, id: str) -> Document:
        return Document.objects.get(id=id)

    @database_sync_to_async
    def get_content_blocks(self):
        if hasattr(self, 'document'):
            return ContentBlock.objects.filter(document=self.document)

    @database_sync_to_async
    def update_document_title(self, text: str) -> None:
        """ Function to update document title with request text """
        self.document.title = text
        self.document.save(update_fields=['title'])

    @database_sync_to_async
    def update_document_content(self, **kwargs) -> None:
        """
        Function to update the content of a document. Replaces the text in blocks
        between anchor_block_key and focus_block_key, from the specific anchor_offset
        and focus_offset within their respective block. (anchor is equivellant to start position,
        and focus is equivellant to end position)
        """
        if kwargs['anchorBlockKey'] == kwargs['focusBlockKey']:
            # All edits have occurred in the same content block
            block: ContentBlock = self.document.blocks.get(
                key=kwargs['anchorBlockKey'])
            block.text = block.text[:kwargs['anchorOffset']] + \
                kwargs['text'] + block.text[kwargs['focusOffset']:]
            print(block.text)
            block.save(update_fields=['text'])
        else:
            # Changes have occurred over multiple content blocks
            blocks: list[ContentBlock] = self.document.block_range(
                kwargs['anchorBlockKey'], kwargs['focusBlockKey'])

            for index, text in enumerate(kwargs['text'].split('\n')):
                print(text)
                blocks[index].text = text
                blocks[index].save(update_fields=['text'])
