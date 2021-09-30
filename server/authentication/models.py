from uuid import uuid4
from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    """ Custom user model """
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    profile_picture = models.ImageField(
        upload_to='profile-pictures/', null=True, blank=True, default='profile-pictures/default-profile-picture.jpg')
    # Fields for temporary authentication tickets for WebSocket hand shake as protocol doesn't support secure headers for transporting auth token
    authentication_ticket = models.UUIDField(
        null=True, default=None, unique=True)
    authentication_ticket_expires_at = models.DateTimeField(
        null=True, default=None)
