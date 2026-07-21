from django.urls import path
from . import views

urlpatterns = [
    path('', views.portafolio_index, name='portafolio_index'),
]