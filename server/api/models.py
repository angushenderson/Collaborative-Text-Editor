from __future__ import annotations
from uuid import uuid4
from django.db import models
from django.core.validators import MinLengthValidator, MaxLengthValidator
from authentication.models import User


class Document(models.Model):
    """ Model for representing a document page. Content is constructed from a series of ordered content blocks """
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    title = models.CharField(max_length=256, default='', blank=True)

    def user_is_owner(self, user: User) -> bool:
        """ Determine wether a given user is the owner of the Document """
        collaborator: DocumentCollaborator = self.collaborators.get(user, None)
        if collaborator:
            return collaborator.permission == 0
        return False


class DocumentCollaborator(models.Model):
    """ Intermediary table for collaborators of a specific document """
    PERMISSION_CHOICES = (
        (0, 'Owner'),
        (1, 'Admin'),
        (2, 'Editor'),
        (3, 'Viewer'),
    )
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    document = models.ForeignKey(
        Document, on_delete=models.CASCADE, related_name='collaborators')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    permission = models.PositiveSmallIntegerField(choices=PERMISSION_CHOICES, default=3, validators=(
        MinLengthValidator(0), MaxLengthValidator(len(PERMISSION_CHOICES))))

    def __str__(self) -> str:
        return f'{self.user.username}: {self.permission}'

    def permission_level(self) -> str:
        """ Get the string representation of a users permission level from int """
        return next((permission for permission_level, permission in self.PERMISSION_CHOICES if permission_level == self.permission), None)


class ContentBlock(models.Model):
    """
    Model representing single content block in larger document.
    A stronger typed version of a serialized Draft.js object.
    """
    document = models.ForeignKey(
        Document, related_name='blocks', on_delete=models.CASCADE)
    key = models.CharField(max_length=5, blank=False)
    text = models.TextField(default='', blank=True)
    type = models.CharField(default='unstyled', max_length=20)
    # NOTE I know this isn't the best way of indexing the blocks... but this is a small personal project, and this database isn't realistically going to get hit that often
    index = models.PositiveIntegerField()

    class Meta:
        ordering = ['index']


class InlineStyle(models.Model):
    """ Model representing a single inline style as part of a series in a ContentBlock """
    content_block = models.ForeignKey(
        ContentBlock, related_name='styles', on_delete=models.CASCADE)
    length = models.PositiveIntegerField()
    offset = models.PositiveIntegerField()
    style = models.CharField(max_length=10)
