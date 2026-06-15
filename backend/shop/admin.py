from django.contrib import admin
from django.utils.html import format_html
from .models import Categoria, Producto, Orden, ItemOrden

@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    # Columnas que se mostrarán en la lista de categorías
    list_display = ('id', 'nombre', 'descripcion')
    search_fields = ('nombre',)

@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    # RÚBRICA: Columnas clave para monitorear productos, precios, stock e imágenes
    list_display = ('mostrar_imagen', 'nombre', 'categoria', 'precio_formateado', 'stock_estado', 'es_activo')
    
    # Filtros laterales para una rápida gestión de inventario
    list_filter = ('categoria', 'es_activo')
    
    # Buscador por nombre de pastel o categoría
    search_fields = ('nombre', 'categoria__nombre')
    
    # Permite editar el precio y el stock directamente desde la lista sin entrar al producto
    list_editable = ('es_activo',)

    # Métodos personalizados para mejorar el monitoreo visual en el panel
    def precio_formateado(self, obj):
        return f"S/ {obj.precio:.2f}"
    precio_formateado.short_description = 'Precio'

    def stock_estado(self, obj):
        """Muestra el stock con una alerta visual si se está agotando"""
        if obj.stock == 0:
            return format_html('<span style="color: red; font-weight: bold;"> AGOTADO (0)</span>')
        elif obj.stock <= 5:
            return format_html('<span style="color: orange; font-weight: bold;"> CRÍTICO ({})</span>', obj.stock)
        return format_html('<span style="color: green;">✔ {} uds</span>', obj.stock)
    stock_estado.short_description = 'Inventario / Stock'

    def mostrar_imagen(self, obj):
        """Renderiza una miniatura de la imagen en el propio menú de administración"""
        if obj.imagen_url:
            return format_html('<img src="{}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;" />', obj.imagen_url)
        return "Sin imagen"
    mostrar_imagen.short_description = 'Miniatura'


# --- CONFIGURACIÓN PARA EL MONITOREO DE ÓRDENES DE VENTA ---
class ItemOrdenInline(admin.TabularInline):
    """Permite ver los productos comprados dentro de la misma vista de la Orden"""
    model = ItemOrden
    extra = 0
    readonly_fields = ('producto', 'cantidad', 'precio_unitario')

@admin.register(Orden)
class OrdenAdmin(admin.ModelAdmin):
    list_display = ('id', 'fecha_creacion', 'estado_pago', 'total_formateado', 'direccion_entrega', 'fecha_entrega_programada')
    list_filter = ('estado', 'fecha_creacion')
    inlines = [ItemOrdenInline] # Muestra el desglose de pasteles comprados

    def total_formateado(self, obj):
        return f"S/ {obj.total:.2f}"
    total_formateado.short_description = 'Total Pagado'

    def estado_pago(self, obj):
        if obj.estado == 'PAGADO':
            return format_html('<b style="color: green;">💳 PAGADO (Izipay)</b>')
        elif obj.estado == 'RECHAZADO':
            return format_html('<b style="color: red;"> RECHAZADO</b>')
        return format_html('<b style="color: orange;"> PENDIENTE</b>')
    estado_pago.short_description = 'Estado'