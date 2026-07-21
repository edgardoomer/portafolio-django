from django.shortcuts import render

# Create your views here.
from django.shortcuts import render
from django.views import View

class HomeView(View):
    def get(self, request):
        context = {
        'titulo': 'CV - Home',
        'section': 'about'
    }
        return render(request, "home_view.html", context)


class AskEdgarView(View):
    def get(self, request):
        context = {
        'titulo': 'AskEdgar.IA',
        'section': 'resume'
    }
        return render(request, "askedgar_view.html", context)
    

class CurriculumView(View):
    def get(self, request):
        context = {
        'titulo': 'Mi curriculum',
        'section': 'curriculum'
    }
        return render(request, "curriculum_view.html", context)

#class CurriculumView(View):
#    def get(self, request):
#        context = {
#        'titulo': 'CV - Curriculum',
#        'section': 'curriculum'
#    }
#        return render(request, "site_app/curriculum.html", context) #cambiar ruta


class ContactView(View):
    def get(self, request):
        context = {
        'titulo': 'Contacto',
        'section': 'contact'
    }
        return render(request, "contact_view.html", context)
