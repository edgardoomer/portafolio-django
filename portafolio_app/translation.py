from modeltranslation.translator import register, TranslationOptions
from .models import Proyecto

@register(Proyecto)
class ProyectoTranslationOptions(TranslationOptions):
    fields = ('titulo', 'objetivo', 'descripcion') # Campos a tradcr 

