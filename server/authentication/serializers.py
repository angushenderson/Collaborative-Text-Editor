from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework.serializers import ModelSerializer
from rest_framework.validators import UniqueValidator
from authentication.models import User


class RegisterUserSerializer(ModelSerializer):
    """ Serializer class for creating User models """
    username = serializers.CharField(required=True, validators=[
        UniqueValidator(queryset=User.objects.all())])
    password = serializers.CharField(
        write_only=True, required=True, validators=[validate_password], style={'input_type': 'password'})

    class Meta:
        model = User
        fields = ('username', 'password')

    def validate(self, attrs):
        """ Validate the incoming data """
        return super().validate(attrs)

    def create(self, validated_data) -> User:
        """ Create a new user object from pre validated data """
        user = User.objects.create(username=validated_data['username'])
        user.set_password(validated_data['password'])
        user.save()
        return user

    def to_representation(self, instance) -> dict:
        """ Remove all data from body as token is sent in HttpOnly Cookie """
        return {}
