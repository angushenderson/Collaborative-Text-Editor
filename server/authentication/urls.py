from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from authentication.views import *


urlpatterns = [
    path('register/', RegisterUserView.as_view(), name='create_user'),
    path('validate-password/', PasswordStrengthValidatorView.as_view(),
         name='password_strength_validator'),
    path('validate-username/<str:username>', UniqueUsernameValidatorView.as_view(),
         name='validate-username'),
    # Token is where the user will 'sign in'
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
