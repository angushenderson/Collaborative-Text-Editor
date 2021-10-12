from django.urls import path
from api.views import *


urlpatterns = [
    path('documents/', DocumentsListCreateView.as_view(), name='documents'),
    path('documents/<str:pk>/', DocumentView.as_view(), name='document-view'),
    path('collaborators/', CollaboratorsView.as_view(),
         name='document-collaborators-view'),
    path('users/search/', UserSearchView.as_view(), name='user-search-view'),
]
