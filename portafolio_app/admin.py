from django.contrib import admin
from .models import Proyecto

# visor del admin para el modelo Proyecto
@admin.register(Proyecto)
class ProyectoAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'tecnologias', 'created_at')
    search_fields = ('titulo', 'tecnologias', 'objetivo')   
    list_filter = ('created_at',)