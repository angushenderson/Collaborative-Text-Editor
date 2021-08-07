from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.core import exceptions
from api.models import User


def is_password_valid(password: str) -> dict:
    """
    Function to determine the strength of a given password in accordance to the
    established django password security rules.
    :return dict: Dictionary: `valid` key `bool` represents the validity of the password
                `errors` is a `list` of errors if `valid` if False
    """
    errors: dict = {}
    try:
        # Validate the password, catching any exceptions
        validate_password(password)
        errors['valid'] = True
    except exceptions.ValidationError as e:
        # Error whilst validating password
        errors['valid'] = False
        errors['errors'] = list(e.messages)

    return errors


def is_email_valid(email: str) -> bool:
    """
    Function to determine if an email is valid
    :return bool: True if valid
    """
    try:
        validate_email(email)
    except ValidationError as e:
        # Error whilst validating email
        return False
    else:
        return True
