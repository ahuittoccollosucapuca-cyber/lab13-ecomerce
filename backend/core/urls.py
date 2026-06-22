"""
URL configuration for core project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
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
from django.urls import path
# Importamos las dos nuevas funciones que creamos en views.py
from shop.views import listar_productos, izipay_webhook, validar_cupon, listar_comentarios

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/productos/', listar_productos),
    
    # Ajustamos esta ruta para que calce con el fetch de tu App.jsx (api/izipay/webhook/)
    path('api/izipay/webhook/', izipay_webhook),
    
    # NUEVAS RUTAS CONECTADAS DIRECTAMENTE AL CORE:
    path('api/cupones/validar/', validar_cupon),
    path('api/comentarios/', listar_comentarios),
]

admin.site.site_header = " Panel de Control - Sweet & Grace"
admin.site.site_title = "Sweet & Grace Admin"
admin.site.index_title = "Monitoreo de Inventario, Categorías y Pasarela Izipay"
