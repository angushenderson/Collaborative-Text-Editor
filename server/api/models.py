from uuid import uuid4
from django.db import models
from django.core.validators import MinLengthValidator, MaxLengthValidator
from django.contrib.auth.models import AbstractUser
from authentication.models import User


class Document(models.Model):
    """ Model for representing a document page """
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    title = models.CharField(max_length=255, null=True, blank=True)
    collaborators = models.ManyToManyField(
        User, through='DocumentCollaborator', through_fields=('document', 'user'), related_name='collaborators')


class DocumentCollaborator(models.Model):
    """ Intermediary table for collaborators of a specific document """
    PERMISSION_CHOICES = (
        (0, 'Owner'),
        (1, 'Editor'),
        (2, 'Viewer'),
    )
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    document = models.ForeignKey(Document, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    permission = models.IntegerField(choices=PERMISSION_CHOICES, default=2, validators=(
        MinLengthValidator(0), MaxLengthValidator(len(PERMISSION_CHOICES))))

    def __str__(self) -> str:
        return f'{self.user.username}: {self.permission}'
