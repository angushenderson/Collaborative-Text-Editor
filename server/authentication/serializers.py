from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework.serializers import ModelSerializer
from rest_framework.validators import UniqueValidator
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from authentication.models import User


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Serializer class to add additional user data to token pairs
    """

    @classmethod
    def get_token(cls, user: User):
        token = super().get_token(user)

        # Custom token claims
        token['username'] = user.username
        token['profile_picture'] = user.profile_picture.url

        return token


class RegisterUserSerializer(ModelSerializer):
    """ Serializer class for creating User models """
    username = serializers.CharField(required=True, validators=[
        UniqueValidator(queryset=User.objects.all())])
    password = serializers.CharField(
        write_only=True, required=True, validators=[validate_password], style={'input_type': 'password'})

    class Meta:
        model = User
        fields = ('username', 'password', 'profile_picture')
        extra_kwargs = {'profile_picture': {'read_only': True}}

    def validate(self, attrs):
        """ Validate the incoming data """
        return super().validate(attrs)

    def create(self, validated_data) -> User:
        """ Create a new user object from pre validated data """
        user = User.objects.create(username=validated_data['username'])
        user.set_password(validated_data['password'])
        user.save()
        return user

    def to_representation(self, instance: User) -> dict:
        representation = super().to_representation(instance)

        # Generate a new JWT for the newly created user using the above custom token pair serializer
        refresh: RefreshToken = CustomTokenObtainPairSerializer.get_token(
            instance)

        # Add refresh and access tokens to returned representation
        representation = {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }

        return representation


class UserSerializer(ModelSerializer):
    """
    Serializer for custom User model. Don't use this serializer
    for User object creation, use RegisterUserSerializer instead!
    """
    class Meta:
        model = User
        fields = ('username', 'profile_picture', 'id')
        extra_kwargs = {'username': {'required': False}}
