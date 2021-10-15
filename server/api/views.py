from rest_framework.generics import (
    CreateAPIView,
    ListCreateAPIView,
    RetrieveUpdateDestroyAPIView,
    ListAPIView
)
from rest_framework import filters
from api.models import Document, DocumentCollaborator
from api.serializers import DocumentSerializer, DocumentCollaboratorSerializer
from authentication.models import User
from authentication.serializers import UserSerializer


class DocumentsListCreateView(ListCreateAPIView):
    """ API view that lists all documents a user has permissions for """
    serializer_class = DocumentSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['user'] = self.request.user
        if self.request.method == 'POST':
            context['generate_authentication_ticket'] = True
        return context

    def perform_create(self, serializer) -> None:
        serializer.save(user=self.request.user)

    def get_queryset(self):
        """
        Return a queryset of all documents the current
        user has access to. This method has been implemented instead
        of the queryset keyword.
        """
        user = self.request.user
        return Document.objects.filter(collaborators__user=user)


class DocumentView(RetrieveUpdateDestroyAPIView):
    """ API view for editing documents """
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['user'] = self.request.user
        if self.request.method == 'GET':
            context['generate_authentication_ticket'] = True
        return context


class CollaboratorsView(CreateAPIView):
    serializer_class = DocumentCollaboratorSerializer


class UserSearchView(ListAPIView):
    # TODO Filter search results to not show users already in document, and
    #    prevent users from being added in consumer/serializer
    queryset = User.objects.all()
    serializer_class = UserSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['username']
