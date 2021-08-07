from django.core import exceptions
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.generics import CreateAPIView
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from authentication.models import User
from authentication.serializers import RegisterUserSerializer
from authentication.utils import is_password_valid


class RegisterUserView(CreateAPIView):
    """
    API view for creating new users
    """
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterUserSerializer

    def create(self, request, *args, **kwargs) -> Response:
        """ Create a new user view """
        response: Response = super().create(request, *args, **kwargs)
        # Generate a new JWT for the new user
        refresh = RefreshToken.for_user(self.request.user)
        response.set_cookie('token', refresh, httponly=True)
        return response


class PasswordStrengthValidatorView(APIView):
    """
    API view to determine the strength of a given password in accordance to the
    established django password security rules.
    """
    permission_classes = (AllowAny, )

    def post(self, request: Request, format=None) -> Response:
        password: str = request.data.get('password', '')
        errors: dict = is_password_valid(password)

        return Response(errors, status=status.HTTP_200_OK)


class UniqueUsernameValidatorView(APIView):
    """
    API view to determine wether a username is valid or
    already being used by another user.
    """
    permission_classes = (AllowAny, )

    def get(self, request, username, format=None) -> Response:
        """
        `valid` key in response is a boolean value respresenting wether
        the username is valid or not.
        """
        response_data = {'valid': False}

        if username:
            try:
                # Try to find username in database
                user: User = User.objects.get(username=username)
                # User exists, therefore username already in user and invalid
                response_data['valid'] = False
            except exceptions.ObjectDoesNotExist:
                # User with the fetched username doesn't exist, therefore its valid
                response_data['valid'] = True

        return Response(response_data)
