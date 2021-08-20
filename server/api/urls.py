from django.urls import path
from api.views import *


urlpatterns = [
    path('documents/', DocumentsListCreateView.as_view(), name='documents'),
    path('documents/<str:pk>/', DocumentView.as_view(), name='document-view'),
]
