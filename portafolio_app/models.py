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


class ProyectoImagen(models.Model):
    """Imagen adicional de un proyecto, para el slider del portafolio.

    El campo `orden` controla la posición en el slider y se edita desde el
    admin (número más bajo = aparece antes).
    """
    proyecto = models.ForeignKey(
        Proyecto,
        on_delete=models.CASCADE,
        related_name='imagenes',
        verbose_name="Proyecto",
    )
    imagen = models.ImageField(upload_to='portfolio/', verbose_name="Imagen")
    titulo = models.CharField(
        max_length=200, blank=True,
        verbose_name="Descripción (opcional)",
        help_text="Texto alternativo / pie de imagen.",
    )
    orden = models.PositiveIntegerField(
        default=0,
        verbose_name="Orden",
        help_text="Posición en el slider. Menor número aparece primero.",
    )

    class Meta:
        ordering = ['orden', 'id']
        verbose_name = "Imagen del proyecto"
        verbose_name_plural = "Imágenes del proyecto (slider)"

    def __str__(self):
        return f"{self.proyecto.titulo} · imagen #{self.orden}"


class ProyectoEnlace(models.Model):
    """Enlace de un proyecto (repositorio, demo, artículo...).

    Cada proyecto puede tener 0, 1 o varios. Se editan desde el admin y el
    campo `orden` controla en qué orden aparecen (menor número = antes).
    """
    proyecto = models.ForeignKey(
        Proyecto,
        on_delete=models.CASCADE,
        related_name='enlaces',
        verbose_name="Proyecto",
    )
    titulo = models.CharField(
        max_length=100,
        verbose_name="Texto del enlace",
        help_text="Lo que se muestra. Ej: GitHub, Demo en vivo, Artículo.",
    )
    url = models.URLField(max_length=500, verbose_name="URL")
    orden = models.PositiveIntegerField(
        default=0,
        verbose_name="Orden",
        help_text="Posición. Menor número aparece primero.",
    )

    class Meta:
        ordering = ['orden', 'id']
        verbose_name = "Enlace del proyecto"
        verbose_name_plural = "Enlaces del proyecto"

    def __str__(self):
        return f"{self.proyecto.titulo} · {self.titulo}"
