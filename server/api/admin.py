from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from api.models import *


@admin.register(User)
class CustomerUserAdmin(UserAdmin):
    model = User
    fieldsets = UserAdmin.fieldsets + (
        ('Profile customization', {'fields': ('profile_picture',)}),
    )


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    pass
