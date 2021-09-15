from __future__ import annotations
from uuid import uuid4
from django.db import models
from django.core.validators import MinLengthValidator, MaxLengthValidator
from authentication.models import User


class Document(models.Model):
    """ Model for representing a document page. Content is constructed from a series of ordered content blocks """
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    title = models.CharField(max_length=256, default='', blank=True)
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
    permission = models.PositiveSmallIntegerField(choices=PERMISSION_CHOICES, default=2, validators=(
        MinLengthValidator(0), MaxLengthValidator(len(PERMISSION_CHOICES))))

    def __str__(self) -> str:
        return f'{self.user.username}: {self.permission}'


# TODO Look at using document indexes to sort content blocks in the correct order
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

    class Meta:
        ordering = ['pk']


class InlineStyle(models.Model):
    """ Model representing a single inline style as part of a series in a ContentBlock """
    content_block = models.ForeignKey(
        ContentBlock, related_name='inline_styles', on_delete=models.CASCADE)
    length = models.PositiveIntegerField()
    offset = models.PositiveIntegerField()
    style = models.CharField(max_length=10)
