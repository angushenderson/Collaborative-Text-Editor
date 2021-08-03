from rest_framework.generics import ListCreateAPIView
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
