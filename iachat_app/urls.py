from django.urls import path
from . import views

urlpatterns = [
    # La página del chat la sirve site_app.AskEdgarView (bajo prefijo de
    # idioma). Aquí vive solo la API.

    # API del chat
    path('api/chat/enviar/', views.enviar_mensaje, name='iachat_enviar'),
    path('api/chat/nueva/', views.nueva_conversacion, name='iachat_nueva'),
    path('api/chat/lista/', views.lista_conversaciones, name='iachat_lista'),
    path('api/chat/borrar/', views.borrar_conversacion, name='iachat_borrar'),
    path('api/chat/captcha/', views.verificar_captcha, name='iachat_captcha'),
]
