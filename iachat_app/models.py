from django.conf import settings
from django.db import models


class Conversacion(models.Model):
    """Una conversación del chat AskEdgar.

    Puede pertenecer a un usuario autenticado (campo `usuario`) o a un
    visitante anónimo, identificado por la clave de sesión (`session_key`).
    """
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True, blank=True,
        related_name='conversaciones',
        verbose_name="Usuario",
    )
    session_key = models.CharField(
        max_length=40, blank=True, db_index=True,
        verbose_name="Clave de sesión (anónimos)",
    )
    titulo = models.CharField(max_length=120, default="Nueva conversación")

    # Contadores acumulados de la conversación.
    total_palabras = models.PositiveIntegerField(default=0)
    total_tokens = models.PositiveIntegerField(default=0)

    creada = models.DateTimeField(auto_now_add=True)
    actualizada = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-actualizada']
        verbose_name = "Conversación"
        verbose_name_plural = "Conversaciones"

    def __str__(self):
        quien = self.usuario if self.usuario else f"anon:{self.session_key[:8]}"
        return f"{self.titulo} ({quien})"


class Mensaje(models.Model):
    ROLES = (
        ('user', 'Usuario'),
        ('assistant', 'Asistente'),
    )
    conversacion = models.ForeignKey(
        Conversacion,
        on_delete=models.CASCADE,
        related_name='mensajes',
    )
    rol = models.CharField(max_length=12, choices=ROLES)
    contenido = models.TextField()
    tokens = models.PositiveIntegerField(default=0)
    creado = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['creado', 'id']
        verbose_name = "Mensaje"
        verbose_name_plural = "Mensajes"

    def __str__(self):
        return f"[{self.rol}] {self.contenido[:40]}"
