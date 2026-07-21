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

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name', 'cedula', 'afinidad']

    def __str__(self):
        return f"{self.first_name} {self.last_name}"