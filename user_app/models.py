from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import RegexValidator

class CustomUser(AbstractUser):
    # validacion
    numeric_validator = RegexValidator(
        regex=r'^\d+$',
        message="La cédula debe contener solo números."
    )
    cedula = models.CharField(
        max_length=20, 
        unique=True,
        validators=[numeric_validator] #validador solo para numeros
    )
    
    afinidad = models.CharField(max_length=100, blank=True, null=True)
    email = models.EmailField(unique=True)
    empresa = models.CharField(max_length=50, blank=True, null=True)
    puesto = models.CharField(max_length=50, blank=True, null=True)
    profesion = models.CharField(max_length=50, blank=True, null=True)

    # --- Presupuesto de tokens del asistente de IA ---
    # token_limit: tope que puede gastar este usuario (editable en el admin).
    # tokens_usados: cuánto lleva consumido. Cuando tokens_usados >= token_limit
    # el chat le pide que ya no puede continuar.
    token_limit = models.PositiveIntegerField(
        default=1000,
        verbose_name="Límite de tokens IA",
        help_text="Tope de tokens que este usuario puede gastar en el chat IA.",
    )
    tokens_usados = models.PositiveIntegerField(
        default=0,
        verbose_name="Tokens IA usados",
        help_text="Tokens ya consumidos por este usuario en el chat IA.",
    )

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name', 'cedula', 'afinidad']

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

    @property
    def tokens_restantes(self):
        return max(self.token_limit - self.tokens_usados, 0)