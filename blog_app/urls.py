from django.urls import path
from . import views

urlpatterns = [
    path('', views.blog_index, name='blog_index'),
    path('responder/<int:recomendacion_id>/', views.agregar_respuesta, name='agregar_respuesta'),
    path('like/<int:recomendacion_id>/', views.dar_like, name='dar_like'),
]
