from django.conf import settings
from rest_framework.serializers import ModelSerializer
from api.models import Document, DocumentCollaborator


class DocumentSerializer(ModelSerializer):
    """ Serializer class for Document model """

    class Meta:
        model = Document
        fields = '__all__'

    def create(self, validated_data) -> Document:
        """
        Create a new document, owned by the owner making the current request
        """
        user: settings.AUTH_USER_MODEL = validated_data.pop('user')
        document: Document = Document.objects.create(**validated_data)
        # User is creating the document, therefore they are the document owner
        collaborator: DocumentCollaborator = DocumentCollaborator.objects.create(
            document=document, user=user, permission=0)
        return document


class DocumentCollaboratorSerializer(ModelSerializer):
    """ Serializer class for DocumentCollaborator model"""
    class Meta:
        model = DocumentCollaborator
        fields = '__all__'
