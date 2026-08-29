from django.contrib import admin
from .models import Conversacion, Mensaje


class MensajeInline(admin.TabularInline):
    model = Mensaje
    extra = 0
    readonly_fields = ('rol', 'contenido', 'tokens', 'creado')
    can_delete = False


@admin.register(Conversacion)
class ConversacionAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'usuario', 'session_key', 'total_palabras', 'total_tokens', 'actualizada')
    list_filter = ('creada', 'actualizada')
    search_fields = ('titulo', 'usuario__email', 'session_key')
    readonly_fields = ('total_palabras', 'total_tokens', 'creada', 'actualizada')
    inlines = [MensajeInline]


@admin.register(Mensaje)
class MensajeAdmin(admin.ModelAdmin):
    list_display = ('conversacion', 'rol', 'tokens', 'creado')
    list_filter = ('rol', 'creado')
    search_fields = ('contenido',)
