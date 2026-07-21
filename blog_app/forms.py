from django import forms
from .models import Recomendacion, Respuesta

class RecomendacionForm(forms.ModelForm):
    class Meta:
        model = Recomendacion
        fields = ['contenido']
        widgets = {
            'contenido': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 3,
                'placeholder': 'Deja tu recomendación profesional aquí...'
            })
        }

class RespuestaForm(forms.ModelForm):
    class Meta:
        model = Respuesta
        fields = ['contenido']
        widgets = {
            'contenido': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 2,
                'placeholder': 'Responder...'
            })
        }