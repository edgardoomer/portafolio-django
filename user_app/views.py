from django.shortcuts import render, redirect
from django.contrib.auth import login, authenticate, logout
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.utils.http import url_has_allowed_host_and_scheme
from django_ratelimit.decorators import ratelimit
from .forms import CustomUserCreationForm, CustomAuthenticationForm
from .forms import UserUpdateForm


# Anti fuerza bruta: como maximo 10 intentos POST por IP y minuto. Sumado al
# reCAPTCHA del formulario, dificulta mucho los ataques automatizados.
@ratelimit(key='ip', rate='10/m', method='POST', block=True)
def register_view(request):
    if request.method == 'POST':
        
        form = CustomUserCreationForm(request.POST)
        
        if form.is_valid():
            user = form.save() 
            login(request, user)
            
            messages.success(request, f"¡Bienvenido, {user.first_name}!")
            return redirect('login_view') 
            
        else:
            messages.error(request, "Por favor corrige los errores en el formulario.")
    else:
        
        form = CustomUserCreationForm()

    return render(request, 'register.html', {'form': form})


# VISTA DE LOGIN
@ratelimit(key='ip', rate='10/m', method='POST', block=True)
def login_view(request):
    if request.method == 'POST':
        form = CustomAuthenticationForm(request, data=request.POST)
        
        if form.is_valid():
            username = form.cleaned_data.get('username')
            password = form.cleaned_data.get('password')
            user = authenticate(username=username, password=password)
            
            if user is not None:
                login(request, user)
                messages.info(request, f"Has iniciado sesión como {username}.")

                # Solo redirigimos a URLs de este mismo sitio. Sin esta
                # comprobación, ?next=https://sitio-falso.com convertiría
                # el login en una herramienta de phishing.
                next_url = request.GET.get('next')
                if next_url and url_has_allowed_host_and_scheme(
                    url=next_url,
                    allowed_hosts={request.get_host()},
                    require_https=request.is_secure(),
                ):
                    return redirect(next_url)
                return redirect('home_view')
            else:
                messages.error(request, "Usuario o contraseña incorrectos.")
        else:
            messages.error(request, "Usuario o contraseña incorrectos.")
    else:
        form = CustomAuthenticationForm()

    return render(request, 'login.html', {'form': form, 'titulo': 'Iniciar Sesión'})

# VISTA DE LOGOUT (Cerrar Sesión)

@login_required
def logout_view(request):
    logout(request)
    messages.info(request, "Has cerrado sesión correctamente.")
    return redirect('home_view')


# Perfil de usuario
@login_required
def profile_view(request):
    storage = messages.get_messages(request)
    for _ in storage:
        pass
    if request.method == 'POST':
        
        form = UserUpdateForm(request.POST, instance=request.user)
        if form.is_valid():
            form.save()
            messages.success(request, '¡Tu perfil ha sido actualizado!')
            return redirect('profile_view')
    else:
        form = UserUpdateForm(instance=request.user)

    return render(request, 'profile.html', {'form': form})