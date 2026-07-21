from django.urls import path
from site_app.views import *

urlpatterns = [
    path('', HomeView.as_view(), name='home_view'),
    path('ask/', AskEdgarView.as_view(), name='ask_view'),
    path('resumen/', CurriculumView.as_view(), name='curriculum_view'),
    path('contact/', ContactView.as_view(), name='contact_view')
    ]

