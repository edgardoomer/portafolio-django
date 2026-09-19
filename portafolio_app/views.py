from django.shortcuts import render
from .models import Proyecto


def portafolio_index(request):
    # prefetch_related evita una consulta extra por cada proyecto al
    # recorrer sus imágenes del slider y sus enlaces en la plantilla.
    proyectos = (
        Proyecto.objects
        .prefetch_related('imagenes', 'enlaces')
        .order_by('-created_at')
    )
    context = {
        'proyectos': proyectos,
        'section': 'portfolio',
    }
    return render(request, 'portafolio_view.html', context)
