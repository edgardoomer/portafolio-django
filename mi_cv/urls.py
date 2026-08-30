"""
URL configuration for mi_cv project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.conf.urls.i18n import i18n_patterns
from django.http import HttpResponse


def robots_txt(request):
    lines = ["User-agent: *", "Disallow: /api/", "Allow: /"]
    return HttpResponse("\n".join(lines) + "\n", content_type="text/plain")


#para paginas sin traduccion
urlpatterns = [path('i18n/', include('django.conf.urls.i18n')),
               path('robots.txt', robots_txt),
               path('', include('iachat_app.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

#para paginas con traduccion
urlpatterns += i18n_patterns(
    # La ruta del admin viene de ADMIN_URL (.env); por defecto 'admin/'.
    path(settings.ADMIN_URL, admin.site.urls),
    path('', include('site_app.urls')),
    path('user/', include('user_app.urls')),
    path('blog/', include('blog_app.urls')),
    path('portafolio/', include('portafolio_app.urls')),
)