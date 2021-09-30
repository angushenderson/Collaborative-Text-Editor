from .auth import is_token_valid
from rest_framework.serializers import ValidationError


class ValidAccessToken:
    required_context = True

    def __init__(self, base):
        self.base = base

    def __call__(self, token, serializer) -> None:
        print("CALL VALIDATING")
        if not is_token_valid(token, serializer.context['user']):
            raise ValidationError('Access token is invalid.')
