from django.contrib import admin
from .models import Recomendacion, Respuesta, Voto

# 1. CONFIGURACIÓN DE RESPUESTAS EN LÍNEA

class RespuestaInline(admin.TabularInline):
    model = Respuesta
    extra = 0  
    readonly_fields = ('created_at',)
    can_delete = True
    show_change_link = True

# 2. ADMIN DE RECOMENDACIONES
@admin.register(Recomendacion)
class RecomendacionAdmin(admin.ModelAdmin):

    list_display = ('user_full_name', 'resumen_contenido', 'created_at', 'contar_likes', 'contar_respuestas')
    

    search_fields = ('user__first_name', 'user__last_name', 'user__email', 'contenido')
    

    list_filter = ('created_at',)
    

    inlines = [RespuestaInline]
    

    list_per_page = 20

    def user_full_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}"
    user_full_name.short_description = 'Usuario'

    def resumen_contenido(self, obj):
        return obj.contenido[:50] + '...' if len(obj.contenido) > 50 else obj.contenido
    resumen_contenido.short_description = 'Contenido'

    def contar_likes(self, obj):
        return obj.total_likes()
    contar_likes.short_description = 'Likes'
    
    def contar_respuestas(self, obj):
        return obj.respuestas.count()
    contar_respuestas.short_description = 'Respuestas'


# 3. ADMIN DE RESPUESTAS
@admin.register(Respuesta)
class RespuestaAdmin(admin.ModelAdmin):

    list_display = ('user', 'resumen_respuesta', 'recomendacion_link', 'created_at')
    
    search_fields = ('user__first_name', 'contenido', 'recomendacion__contenido')
    list_filter = ('created_at',)

    def recomendacion_link(self, obj):
        return str(obj.recomendacion)[:30]
    recomendacion_link.short_description = 'En respuesta a'

    def resumen_respuesta(self, obj):
        if len(obj.contenido) > 50:
            return obj.contenido[:50] + '...'
        return obj.contenido

    resumen_respuesta.short_description = 'Contenido de la respuesta'


# 4. ADMIN DE VOTOS
@admin.register(Voto)
class VotoAdmin(admin.ModelAdmin):
    list_display = ('user', 'recomendacion_short', 'es_positivo')
    list_filter = ('es_positivo',)

    def recomendacion_short(self, obj):
        return str(obj.recomendacion)[:30]
    recomendacion_short.short_description = 'Recomendación'