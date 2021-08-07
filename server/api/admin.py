from django.contrib import admin
from api.models import *


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    pass
