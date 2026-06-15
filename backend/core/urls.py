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
from shop.views import listar_productos, izipay_webhook

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/productos/', listar_productos),
    path('api/payments/izipay-webhook/', izipay_webhook),
]

admin.site.site_header = " Panel de Control - Sweet & Grace"
admin.site.site_title = "Sweet & Grace Admin"
admin.site.index_title = "Monitoreo de Inventario, Categorías y Pasarela Izipay"
