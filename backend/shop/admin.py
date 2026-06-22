from django.contrib import admin
from django.utils.html import format_html
from .models import Categoria, Producto, Orden, ItemOrden, CuponDescuento, Comentario

@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    # Columnas que se mostrarán en la lista de categorías
    list_display = ('id', 'nombre', 'descripcion')
    search_fields = ('nombre',)

@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    # RÚBRICA: Columnas clave integrando marketing (precio_promocional, es_marketing) e inventario (stock_estado)
    list_display = ('mostrar_imagen', 'nombre', 'categoria', 'precio_formateado', 'precio_promo_formateado', 'stock_estado', 'es_marketing', 'es_activo')
    
    # Filtros laterales para una rápida gestión de inventario y campañas
    list_filter = ('categoria', 'es_activo', 'es_marketing')
    
    # Buscador por nombre de pastel o categoría
    search_fields = ('nombre', 'categoria__nombre')
    
    # Permite editar el stock, flags y promociones directamente desde la lista principal
    list_editable = ('es_activo', 'es_marketing', 'stock')

    # Métodos personalizados para mejorar el monitoreo visual en el panel
    def precio_formateado(self, obj):
        return f"S/ {obj.precio:.2f}"
    precio_formateado.short_description = 'Precio Regular'

    def precio_promo_formateado(self, obj):
        if obj.precio_promocional:
            return f"S/ {obj.precio_promocional:.2f}"
        return "-"
    precio_promo_formateado.short_description = 'Precio Oferta'

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
    # Se añade la columna del cupón aplicado y el usuario a la vista general de ventas
    list_display = ('id', 'usuario', 'fecha_creacion', 'estado_pago', 'total_formateado', 'cupon', 'direccion_entrega', 'fecha_entrega_programada')
    list_filter = ('estado', 'fecha_creacion')
    search_fields = ('direccion_entrega', 'usuario__username')
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


# --- NUEVAS CONFIGURACIONES DE MÓDULOS REQUERIDOS (LABORATORIO 14) ---

@admin.register(CuponDescuento)
class CuponDescuentoAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'porcentaje_formateado', 'estado_cupon')
    list_filter = ('activo',)
    search_fields = ('codigo',)
    list_editable = ('activo',)

    def porcentaje_formateado(self, obj):
        return f"{obj.porcentaje}%"
    porcentaje_formateado.short_description = 'Descuento'

    def estado_cupon(self, obj):
        if obj.activo:
            return format_html('<span style="color: green; font-weight: bold;">Activo</span>')
        return format_html('<span style="color: red;">Inactivo</span>')
    estado_cupon.short_description = 'Estado'


@admin.register(Comentario)
class ComentarioAdmin(admin.ModelAdmin):
    list_display = ('producto', 'usuario', 'estrellas_visuales', 'fecha')
    list_filter = ('calificacion', 'fecha')
    search_fields = ('texto', 'usuario__username', 'producto__nombre')

    def estrellas_visuales(self, obj):
        """Muestra estrellas visuales basadas en la calificación (1-5)"""
        estrellas = "★" * obj.calificacion + "☆" * (5 - obj.calificacion)
        color = "gold" if obj.calificacion >= 4 else "gray"
        return format_html('<span style="color: {}; font-weight: bold;">{}</span>', color, estrellas)
    estrellas_visuales.short_description = 'Calificación'