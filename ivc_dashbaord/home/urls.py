from django.urls import path, include
from django.conf import settings
from . import views
from django.conf.urls.static import static

urlpatterns = [
    path('',views.index),
    path('',views.login),
    path('',views.register),
]