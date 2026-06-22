from rest_framework import serializers
from .models import Categoria, Producto, Orden, ItemOrden, CuponDescuento, Comentario

class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = '__all__'

class ProductoSerializer(serializers.ModelSerializer):
    # Agregamos explícitamente los campos clave del laboratorio
    class Meta:
        model = Producto
        fields = ['id', 'nombre', 'descripcion', 'precio', 'precio_promocional', 'imagen_url', 'stock', 'es_marketing', 'es_activo', 'categoria']

class CuponDescuentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = CuponDescuento
        fields = ['id', 'codigo', 'porcentaje', 'activo']

class ComentarioSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source='usuario.username')

    class Meta:
        model = Comentario
        fields = ['id', 'producto', 'username', 'texto', 'calificacion', 'fecha']