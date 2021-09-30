from abc import abstractmethod
from django.conf import settings
from rest_framework import serializers
from rest_framework.serializers import ModelSerializer
from api.models import Document, DocumentCollaborator, ContentBlock, InlineStyle


class InlineStyleSerializer(ModelSerializer):
    class Meta:
        model = InlineStyle
        fields = ('length', 'offset', 'style')


class ContentBlockSerializer(ModelSerializer):
    styles = InlineStyleSerializer(many=True)

    class Meta:
        model = ContentBlock
        fields = ('key', 'text', 'type', 'styles')

    def to_internal_value(self, data):
        """ Function is run pre validation """
        if 'inlineStyleRanges' in data:
            data['styles'] = data.pop('inlineStyleRanges')

        return super().to_internal_value(data)

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['inlineStyleRanges'] = representation.pop('styles')
        # Add extra paramters for Draft.js editor
        representation.update({'data': {}, 'depth': 0, 'entityRanges': []})
        return representation

    def create(self, validated_data) -> ContentBlock:
        inline_styles = validated_data.pop('inline_styles', [])
        content_block: ContentBlock = ContentBlock.objects.create(
            **validated_data)
        for style in inline_styles:
            style_serializer = InlineStyleSerializer(data=style)
            if style_serializer.is_valid():
                style_serializer.save(content_block=content_block)

        return content_block


class DocumentCollaboratorSerializer(ModelSerializer):
    """ Serializer class for DocumentCollaborator model """
    class Meta:
        model = DocumentCollaborator
        fields = '__all__'


class DocumentSerializer(ModelSerializer):
    """ Serializer class for Document model """
    blocks = ContentBlockSerializer(many=True, required=False)
    # collaborators = DocumentCollaboratorSerializer(many=True, read_only=True)

    class Meta:
        model = Document
        fields = ('id', 'title', 'blocks')

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['editor'] = {
            'blocks': representation.pop('blocks'),
            'entityMap': {},
        }
        return representation

    def create(self, validated_data) -> Document:
        """
        Create a new document - with rich text blocks - owned by the
        owner making the current request
        """
        user: settings.AUTH_USER_MODEL = validated_data.pop('user')
        content_blocks: list = validated_data.pop('blocks', [])

        document: Document = Document.objects.create(**validated_data)
        # User is creating the document, therefore they are the document owner
        collaborator: DocumentCollaborator = DocumentCollaborator.objects.create(
            document=document, user=user, permission=0)

        # Create ContentBlocks
        for block in content_blocks:
            block_serializer = ContentBlockSerializer(data=block)
            if block_serializer.is_valid():
                block_serializer.save(document=document)

        return document


class WebSocketMessageSerializer(serializers.Serializer):
    """ Simple serializer to check the basic validity of a websocket message :- only checks if a type exist """
    type = serializers.CharField(required=True)
    body = serializers.DictField(required=True)


class UpdateDocumentTitleSerializer(serializers.Serializer):
    """ Serializer to handle a document title update """
    title = serializers.CharField(required=True)

    def save(self, instance: Document, **kwargs):
        instance.title = self.validated_data['title']
        instance.save(update_fields=['title'])


class UpdateDocumentContentSerializer(serializers.Serializer):
    """ Serializer to handle a document update """
    data = serializers.ListField(required=True)


class BaseDocumentUpdateContentSerializer(serializers.Serializer):
    """ Base serializer class to be inherited by serializers which modify the content of a document """
    block = serializers.CharField(required=True, min_length=5, max_length=5)
    position = serializers.IntegerField(required=True, min_value=0)

    @abstractmethod
    def save(self, instance: Document, **kwargs) -> None:
        """ Define the behaviour for updating document content """
        return instance.blocks.get(key=self.validated_data['block'])

    def get_block_before(self, block: ContentBlock, instance: Document) -> ContentBlock:
        """
        Get the ContentBlock object which comes before `block` in the instance Document
        None will be returned if it's the last block in the document
        """
        queryset = instance.blocks.filter(index__lt=block.index)
        print(queryset)
        print([b.index for b in instance.blocks.all()])
        return queryset.reverse()[0] if len(queryset) > 0 else None

    def get_block_after(self, block: ContentBlock, instance: Document) -> ContentBlock:
        """
        Get the ContentBlock object which comes after `block` in the instance Document
        None will be returned if it's the last block in the document
        """
        queryset = instance.blocks.filter(index__gt=block.index)
        return queryset[0] if len(queryset) > 0 else None


class InsertDocumentContentSerializer(BaseDocumentUpdateContentSerializer):
    """ Serializer class to handle inserting text into a document's content """
    text = serializers.CharField(
        required=True, trim_whitespace=False, allow_blank=True)

    def save(self, instance: Document, **kwargs) -> None:
        block: ContentBlock = instance.blocks.get_or_create(
            key=self.validated_data['block'], defaults={'index': 0})[0]
        block.text = block.text[:self.validated_data['position']] + \
            self.validated_data['text'] + \
            block.text[self.validated_data['position']:]
        block.save(update_fields=['text'])


class DeleteDocumentContentSerializer(BaseDocumentUpdateContentSerializer):
    """
    Serializer class to handle deleting text from a document's conten
    If position is -1, the given content block will be deleted
    """
    position = serializers.IntegerField(required=True, min_value=-1)
    offset = serializers.IntegerField(required=True, min_value=0)

    def save(self, instance: Document, **kwargs) -> None:
        print('INSTANCE: ', instance)
        block: ContentBlock = instance.blocks.get(
            key=self.validated_data['block'])
        if self.validated_data['position'] == -1:
            if (block_before := self.get_block_before(block, instance)):
                block_before.text += block.text[self.validated_data['position'] +
                                                self.validated_data['offset']:]
                block_before.save(update_fields=['text'])
                block.delete()
        else:
            block.text = block.text[:self.validated_data['position']] + \
                block.text[self.validated_data['position'] +
                           self.validated_data['offset']:]
            block.save(update_fields=['text'])


class SplitContentBlockSerializer(BaseDocumentUpdateContentSerializer):
    newBlock = serializers.CharField(
        required=True, min_length=5, max_length=5)

    def save(self, instance: Document, **kwargs) -> None:
        block: ContentBlock = instance.blocks.get(
            key=self.validated_data['block'])
        overflow_text: str = block.text[self.validated_data['position']:]
        block.text = block.text[:self.validated_data['position']]
        block.save(update_fields=['text'])

        # Shift all block indexes forward
        for b in instance.blocks.filter(index__gt=block.index):
            b.index = b.index + 1
            b.save(update_fields=['index'])

        # Create new ContentBlock
        new_block: ContentBlock = instance.blocks.create(
            key=self.validated_data['newBlock'], text=overflow_text, index=block.index + 1)


class SetContentBlockTypeSerializer(BaseDocumentUpdateContentSerializer):
    """ Serializer for changing the type of a content block """
    newBlockType = serializers.CharField(required=True)
    position = None

    def save(self, instance: Document, **kwargs):
        block: ContentBlock = instance.blocks.get(
            key=self.validated_data['block'])
        block.type = self.validated_data['newBlockType']
        block.save(update_fields=['type'])


class SetInlineStyleSerializer(BaseDocumentUpdateContentSerializer):
    """ Serializers for updating inline styles """
    offset = serializers.IntegerField(required=True, min_value=0)
    style = serializers.CharField(required=True)

    def save(self, instance: Document, **kwargs):
        # TODO Implement this super method throughout all BaseDocumentUpdateContentSerializer classes
        # TODO Will need to update inline styles when inserting or deleting text as well
        block: ContentBlock = super().save(instance, **kwargs)

        block.styles.create(
            length=self.validated_data['offset'], offset=self.validated_data['position'], style=self.validated_data['style'])
        print('Styles: ', block.styles.all())
