from django.db import models

class Proyecto(models.Model):
    titulo = models.CharField(max_length=200, verbose_name="Título del Proyecto")
    imagen = models.ImageField(upload_to='portfolio/', verbose_name="Imagen de portada")
    objetivo = models.TextField(verbose_name="Objetivo")
    descripcion = models.TextField(verbose_name="Resumen del proyecto")
    tecnologias = models.CharField(max_length=200, help_text="Ej: Python, Django, SQL", verbose_name="Tecnologías usadas")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.titulo