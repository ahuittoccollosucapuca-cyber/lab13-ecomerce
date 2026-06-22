from django.urls import path
from . import views

urlpatterns = [
    path('productos/', views.listar_productos, name='listar_productos'),
    path('izipay/webhook/', views.izipay_webhook, name='izipay_webhook'),
    
    # NUEVAS RUTAS CONECTADAS:
    path('cupones/validar/', views.validar_cupon, name='validar_cupon'),
    path('comentarios/', views.listar_comentarios, name='listar_comentarios'),
]