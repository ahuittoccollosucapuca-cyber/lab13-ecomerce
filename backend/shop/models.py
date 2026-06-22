from django.db import models
from django.contrib.auth.models import User  # Necesario para asociar órdenes y comentarios a usuarios reales

class Categoria(models.Model):
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.nombre

    class Meta:
        verbose_name_plural = "Categorias"


class Producto(models.Model):
    categoria = models.ForeignKey(Categoria, on_delete=models.CASCADE, related_name='productos')
    nombre = models.CharField(max_length=150)
    descripcion = models.TextField()
    
    # Campo obligatorio principal
    precio = models.DecimalField(max_digits=10, decimal_places=2)  
    
    # Campo opcional para promociones y marketing estratégico
    precio_promocional = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)  
    
    stock = models.IntegerField(default=0)
    imagen_url = models.URLField(max_length=500, blank=True, null=True)
    es_activo = models.BooleanField(default=True)
    es_marketing = models.BooleanField(default=False)  

    def __str__(self):
        return self.nombre

    def actualizar_stock(self, cantidad):
        self.stock += cantidad
        self.save()

    # Nuevo método para obtener el precio real considerando si está en oferta
    def obtener_precio_final(self):
        # Si tiene el flag de marketing activado Y se configuró un precio de oferta válido, se aplica.
        if self.es_marketing and self.precio_promocional:
            return self.precio_promocional
        return self.precio


class CuponDescuento(models.Model):  # Nuevo: Requisito de descuento estructurado
    codigo = models.CharField(max_length=50, unique=True)
    porcentaje = models.IntegerField()  # Ejemplo: 10 para un 10%
    activo = models.BooleanField(default=True)

    def __str__(self):
        return self.codigo

    def es_valido(self):
        return self.activo


class Orden(models.Model):
    ESTADOS_CHOICES = [('PENDIENTE', 'Pendiente'), ('PAGADO', 'Pagado'), ('RECHAZADO', 'Rechazado')]
    
    # Añadimos relación con Usuario y Cupón según los diagramas aprobados
    usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ordenes', null=True, blank=True)
    cupon = models.ForeignKey(CuponDescuento, on_delete=models.SET_NULL, blank=True, null=True)
    
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    estado = models.CharField(max_length=20, choices=ESTADOS_CHOICES, default='PENDIENTE')
    total = models.DecimalField(max_digits=10, decimal_places=2)
    direccion_entrega = models.CharField(max_length=255)
    fecha_entrega_programada = models.DateTimeField()

    def __str__(self):
        return f"Orden #{self.id} - {self.estado}"


class ItemOrden(models.Model):  # Tu modelo ItemOrden (equivalente a LineaDeOrden del DER)
    orden = models.ForeignKey(Orden, on_delete=models.CASCADE, related_name='items')
    producto = models.ForeignKey(Producto, on_delete=models.PROTECT)
    cantidad = models.IntegerField()
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.cantidad} x {self.producto.nombre}"


class Comentario(models.Model):  # Nuevo: Módulo analítico/recomendaciones del Lab 14
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE, related_name='comentarios')
    usuario = models.ForeignKey(User, on_delete=models.CASCADE)
    texto = models.TextField()
    calificacion = models.IntegerField()  # Escala del 1 al 5 (estrellas)
    fecha = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        # CORRECCIÓN: Se remueve la coma final que causaba el retorno de una tupla inesperada
        return f"Comentario de {self.usuario.username} en {self.producto.nombre}"