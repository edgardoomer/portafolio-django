from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator
from django.db.models import Count, Prefetch, Q
from .models import Recomendacion, Respuesta, Voto
from .forms import RecomendacionForm, RespuestaForm


def blog_index(request):

    # Procesar nueva recomendación
    if request.method == 'POST' and 'btn_recomendacion' in request.POST:
        # Sin esta comprobación, un visitante anónimo llegaba a
        # rec.user = AnonymousUser y reventaba la vista.
        if not request.user.is_authenticated:
            return redirect('login_view')

        form = RecomendacionForm(request.POST)
        if form.is_valid():
            rec = form.save(commit=False)
            rec.user = request.user
            rec.save()
            return redirect('blog_index')
    else:
        form = RecomendacionForm()

    # Una sola consulta para autores, likes y respuestas, en lugar de
    # ~6 consultas por cada recomendación mostrada.
    recomendaciones = (
        Recomendacion.objects
        .select_related('user')
        .prefetch_related(
            Prefetch('respuestas',
                     queryset=Respuesta.objects.select_related('user'))
        )
        .annotate(
            likes_count=Count('voto', filter=Q(voto__es_positivo=True), distinct=True),
            respuestas_count=Count('respuestas', distinct=True),
        )
        .order_by('-created_at')
    )

    # Paginamos: sin esto, la página crece sin límite con cada recomendación.
    paginator = Paginator(recomendaciones, 10)
    page_obj = paginator.get_page(request.GET.get('page'))

    # Formulario vacío para las respuestas
    respuesta_form = RespuestaForm()

    context = {
        'recomendaciones': page_obj,
        'page_obj': page_obj,
        'form': form,
        'respuesta_form': respuesta_form,
        'section': 'blog'
    }
    return render(request, 'blog.html', context)

@login_required
def agregar_respuesta(request, recomendacion_id):
    recomendacion = get_object_or_404(Recomendacion, pk=recomendacion_id)
    if request.method == 'POST':
        form = RespuestaForm(request.POST)
        if form.is_valid():
            resp = form.save(commit=False)
            resp.user = request.user
            resp.recomendacion = recomendacion
            resp.save()
    return redirect('blog_index')

@login_required
def dar_like(request, recomendacion_id):
    recomendacion = get_object_or_404(Recomendacion, pk=recomendacion_id)
    
    # Verificar si ya existe el voto
    voto_existente = Voto.objects.filter(recomendacion=recomendacion, user=request.user).first()

    if voto_existente:
        # Si ya dio like, se lo quitamos (Toggle)
        voto_existente.delete()
    else:
        # Si no, creamos el like
        Voto.objects.create(recomendacion=recomendacion, user=request.user, es_positivo=True)
        
    return redirect('blog_index')