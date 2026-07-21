from django.db import models
from django.conf import settings

# 1. TABLA DE RECOMENDACIONES (El "Post" principal)
class Recomendacion(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    contenido = models.TextField(verbose_name="Escribe tu recomendación")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Recomendación de {self.user} ({self.created_at.strftime('%d/%m/%Y')})"

    # Método auxiliar para contar likes (True)
    def total_likes(self):
        return self.voto_set.filter(es_positivo=True).count()

# 2. TABLA DE RESPUESTAS (Hilos de conversación)
class Respuesta(models.Model):
    recomendacion = models.ForeignKey(Recomendacion, on_delete=models.CASCADE, related_name='respuestas')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    contenido = models.TextField(verbose_name="Escribe tu respuesta")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Respuesta de {self.user} a {self.recomendacion.id}"

# 3. TABLA DE LIKES/VOTOS
class Voto(models.Model):
    recomendacion = models.ForeignKey(Recomendacion, on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    # Booleano: 1 (True) es Like, 0 (False) podría ser Dislike si quisieras implementarlo
    es_positivo = models.BooleanField(default=True) 

    class Meta:
        unique_together = ('recomendacion', 'user')

