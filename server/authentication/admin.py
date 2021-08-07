from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from authentication.models import User


@admin.register(User)
class CustomerUserAdmin(UserAdmin):
    model = User
    fieldsets = UserAdmin.fieldsets + (
        ('Profile customization', {'fields': ('profile_picture',)}),
    )
