from uuid import uuid4
from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    """ Custom user model """
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    profile_picture = models.ImageField(
        upload_to='profile-pictures/', null=True, blank=True, default='profile-pictures/default-profile-picture.jpg')
