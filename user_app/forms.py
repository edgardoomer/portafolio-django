from django import forms
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from .models import CustomUser
from django.utils.translation import gettext_lazy as _

# Importamos el Captcha (versión nueva como corregimos antes)
from django_recaptcha.fields import ReCaptchaField 
from django_recaptcha.widgets import ReCaptchaV2Checkbox

class CustomUserCreationForm(UserCreationForm):
    # Campo de Captcha
    captcha = ReCaptchaField(widget=ReCaptchaV2Checkbox(attrs={
        'data-theme': 'light',
        'style': 'margin-bottom: 10px;'
    }))

    class Meta:
        model = CustomUser
        # Aquí definimos el orden en que aparecerán en el HTML
        fields = [
            'first_name', 
            'last_name', 
            'cedula', 
            'email', 
            'profesion', # Nuevo
            'puesto',    # Nuevo
            'empresa',   # Nuevo
            'afinidad'
        ]
        
        # Estilos para que se vean modernos (Bootstrap/Custom CSS)
        widgets = {
            'first_name': forms.TextInput(attrs={'class': 'form-control', 'placeholder': _('Tu nombre')}),
            'last_name': forms.TextInput(attrs={'class': 'form-control', 'placeholder': _('Tu apellido')}),
            'cedula': forms.TextInput(attrs={'class': 'form-control', 'placeholder': _('Cédula de identidad')}),
            
            # Email es crucial para el login ahora
            'email': forms.EmailInput(attrs={'class': 'form-control', 'placeholder': _('nombre@correo.com')}),
            
            # Nuevos campos profesionales
            'profesion': forms.TextInput(attrs={'class': 'form-control', 'placeholder': _('Ej: Ing. de Petróleos')}),
            'puesto': forms.TextInput(attrs={'class': 'form-control', 'placeholder': _('Ej: Gerente de Operaciones')}),
            'empresa': forms.TextInput(attrs={'class': 'form-control', 'placeholder': _('Ej: Petroecuador / SLB')}),
            'afinidad': forms.TextInput(attrs={'class': 'form-control', 'placeholder': _('Amigo? Jefe? Familiar?')}),
        }

class CustomAuthenticationForm(AuthenticationForm):
    # Login por Email (como definiste USERNAME_FIELD = 'email')
    username = forms.CharField(
        label='Correo Electrónico',
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': _('tu@email.com'),
            'autofocus': True
        })
    )
    password = forms.CharField(
        label=_("Contraseña"),
        widget=forms.PasswordInput(attrs={
            'class': 'form-control',
            'placeholder': _('Ingresa tu contraseña'),
            'autocomplete': 'current-password'
        })
    )
    
    #campo de captcha
    captcha = ReCaptchaField(widget=ReCaptchaV2Checkbox())
    
class UserUpdateForm(forms.ModelForm):
    class Meta:
        model = CustomUser
        fields = ['first_name', 'last_name', 'cedula', 'profesion', 'puesto', 'empresa', 'afinidad']
        
        widgets = {
            'first_name': forms.TextInput(attrs={'class': 'form-control'}),
            'last_name': forms.TextInput(attrs={'class': 'form-control'}),
            'cedula': forms.TextInput(attrs={'class': 'form-control', 'readonly': 'readonly'}), # Cédula no editable
            'profesion': forms.TextInput(attrs={'class': 'form-control'}),
            'puesto': forms.TextInput(attrs={'class': 'form-control'}),
            'empresa': forms.TextInput(attrs={'class': 'form-control'}),
            'afinidad': forms.TextInput(attrs={'class': 'form-control'}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Poner etiquetas bonitas
        self.fields['cedula'].help_text = _("No puedes cambiar tu cédula.")