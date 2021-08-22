from django.conf import settings
from rest_framework.serializers import ModelSerializer
from rest_framework import serializers
from api.models import Document, DocumentCollaborator, ContentBlock, InlineStyle


class InlineStyleSerializer(ModelSerializer):
    class Meta:
        model = InlineStyle
        fields = ('length', 'offset', 'style')


class ContentBlockSerializer(ModelSerializer):
    inline_styles = InlineStyleSerializer(many=True)

    class Meta:
        model = ContentBlock
        fields = ('key', 'text', 'type', 'inline_styles')

    def to_internal_value(self, data):
        """ Function is run pre validation """
        if 'inlineStyleRanges' in data:
            data['inline_styles'] = data.pop('inlineStyleRanges')

        return super().to_internal_value(data)

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['inlineStyleRanges'] = representation.pop(
            'inline_styles')
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

    def create(self, validated_data) -> Document:
        """
        Create a new document - with rich text blocks - owned by the
        owner making the current request
        """
        user: settings.AUTH_USER_MODEL = validated_data.pop('user')
        content_blocks: list = validated_data.pop('blocks', [])

        print(validated_data)
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
