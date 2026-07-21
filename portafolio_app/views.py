from django.shortcuts import render
from .models import Proyecto

def portafolio_index(request):
    proyectos = Proyecto.objects.all().order_by('-created_at')
    context = {
        'proyectos': proyectos,
        'section': 'portfolio'
    }
    return render(request, 'portafolio_view.html', context)