"""Actualiza las rutas de las imagenes del portafolio de PNG a WebP.

Los archivos se convirtieron a WebP para reducir el peso de la pagina de
unos 16 MB a menos de 1 MB. Los registros de Proyecto siguen apuntando al
nombre antiguo, asi que hay que reescribir el campo `imagen`.

Solo se tocan las filas cuya imagen termina en una extension convertida;
cualquier imagen subida despues (ya en .webp) se queda como esta.
"""

from django.db import migrations

EXTENSIONES = ('.png', '.PNG')


def png_a_webp(apps, schema_editor):
    Proyecto = apps.get_model('portafolio_app', 'Proyecto')
    for proyecto in Proyecto.objects.all():
        nombre = proyecto.imagen.name or ''
        if nombre.endswith(EXTENSIONES):
            proyecto.imagen.name = nombre.rsplit('.', 1)[0] + '.webp'
            proyecto.save(update_fields=['imagen'])


def webp_a_png(apps, schema_editor):
    Proyecto = apps.get_model('portafolio_app', 'Proyecto')
    for proyecto in Proyecto.objects.all():
        nombre = proyecto.imagen.name or ''
        if nombre.endswith('.webp'):
            proyecto.imagen.name = nombre.rsplit('.', 1)[0] + '.png'
            proyecto.save(update_fields=['imagen'])


class Migration(migrations.Migration):

    dependencies = [
        ('portafolio_app', '0002_proyecto_descripcion_en_proyecto_descripcion_es_and_more'),
    ]

    operations = [
        migrations.RunPython(png_a_webp, webp_a_png),
    ]
