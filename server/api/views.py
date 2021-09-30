from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from api.models import Document
from api.serializers import DocumentSerializer


class DocumentsListCreateView(ListCreateAPIView):
    """ API view that lists all documents a user has permissions for """
    serializer_class = DocumentSerializer

    def perform_create(self, serializer) -> None:
        serializer.save(user=self.request.user)

    def get_queryset(self):
        """
        Return a queryset of all documents the current
        user has access to. This method has been implemented instead
        of the queryset keyword.
        """
        user = self.request.user
        return Document.objects.filter(collaborators=user)


class DocumentView(RetrieveUpdateDestroyAPIView):
    """ API view for editing documents """
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer
    permission_classes = [permissions.AllowAny]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['user'] = self.request.user
        return context
