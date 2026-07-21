from django.urls import path

from . import views

urlpatterns = [
    # Esta es la ruta que busca tu JavaScript
    path('api/chat/', views.iachat_api, name='iachat_api'),
    
    # Esta es la ruta para ver la página (si tienes una vista para el template)
    path('ask/', views.ask_view, name='ask_view'), 
]
