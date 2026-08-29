from django.contrib import admin
from django.utils.html import format_html
from .models import Proyecto, ProyectoImagen


class ProyectoImagenInline(admin.TabularInline):
    """Imágenes del slider, reordenables mediante el campo 'orden'."""
    model = ProyectoImagen
    extra = 1
    fields = ('preview', 'imagen', 'titulo', 'orden')
    readonly_fields = ('preview',)
    ordering = ('orden', 'id')

    def preview(self, obj):
        if obj and obj.imagen:
            return format_html(
                '<img src="{}" style="height:60px; border-radius:6px;" />',
                obj.imagen.url,
            )
        return "—"
    preview.short_description = "Vista previa"


@admin.register(Proyecto)
class ProyectoAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'tecnologias', 'num_imagenes', 'created_at')
    search_fields = ('titulo', 'tecnologias', 'objetivo')
    list_filter = ('created_at',)
    inlines = [ProyectoImagenInline]

    def num_imagenes(self, obj):
        return obj.imagenes.count()
    num_imagenes.short_description = "Imágenes en slider"
