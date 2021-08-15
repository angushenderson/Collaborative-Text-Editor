from django.core import exceptions
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.generics import CreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from authentication.models import User
from authentication.serializers import CustomTokenObtainPairSerializer, RegisterUserSerializer, UserSerializer
from authentication.utils import is_password_valid


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Token claim view for tokens with additional data
    """
    serializer_class = CustomTokenObtainPairSerializer


class RegisterUserView(CreateAPIView):
    """
    API view for creating new users.
    All token generation is handled in `RegisterUserSerializer`
    """
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterUserSerializer


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
                User.objects.get(username=username)
                # User exists, therefore username already in user and invalid
                response_data['valid'] = False
            except exceptions.ObjectDoesNotExist:
                # User with the fetched username doesn't exist, therefore its valid
                response_data['valid'] = True

        return Response(response_data)


class UserView(RetrieveUpdateDestroyAPIView):
    """ View to allow user to modify their account """
    serializer_class = UserSerializer
    permission_classes = (IsAuthenticated,)

    def get_object(self) -> User:
        """
        Returns the currently authenticated user object for a given request.
        """
        return self.request.user
