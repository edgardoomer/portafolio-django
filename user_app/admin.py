from django.contrib import admin

from .models import *
# Register your models here.

class UserAdmin(admin.ModelAdmin):
    list_display = ['id', 'username', 'first_name', 'last_name', 'cedula', 'email',
                    'afinidad', 'empresa', 'puesto', 'profesion', 'date_joined', 'last_login', 'is_staff', 'is_active']
    
    search_fields = ('first_name', 'last_name', 'cedula', 'email', 'afinidad', 'empresa', 'puesto', 'profesion')
    
    add_fieldsets = (
        (None, {'classes': ('wide',),'fields': 
            ('first_name', 'last_name', 'cedula', 'email', 'password1', 'password2', 'afinidad', 'empresa', 'puesto', 'profesion', 'is_staff', 'is_active')}),)
admin.site.register(CustomUser, UserAdmin)