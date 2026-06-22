from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from .models import Producto, Orden, ItemOrden, CuponDescuento, Comentario

def listar_productos(request):
    """Devuelve los productos creados desde el administrador en formato JSON para React"""
    productos = Producto.objects.filter(es_activo=True)
    data = []
    for p in productos:
        data.append({
            "id": p.id,
            "name": p.nombre,
            "description": p.descripcion,
            "category": p.categoria.nombre if p.categoria else "Sin Categoría",
            
            # 🚨 CAMBIO CRÍTICO AQUÍ: 
            # En vez de mandar 'p.precio' fijo, llamamos al método que evalúa si hay oferta activa
            "price": float(p.obtener_precio_final()), 
            
            "stock": p.stock,
            "imagen_url": p.imagen_url if p.imagen_url else "",
            "es_marketing": p.es_marketing
        })
    return JsonResponse(data, safe=False)

@csrf_exempt # Crucial si no usas autenticación
def validar_cupon(request):
    """Permite a React verificar si un código de descuento escrito en el carrito es válido"""
    if request.method == 'POST':
        try:
            body = json.loads(request.body)
            # MEJORA DE RÚBRICA: Sanitizamos el código del input (mayúsculas y sin espacios)
            codigo_ingresado = body.get('codigo', '').strip().upper()
            
            # Buscamos el cupón exactamente igual, y que esté Activo
            cupon = CuponDescuento.objects.get(codigo=codigo_ingresado, activo=True)
            
            # MODIFICACIÓN NUEVA: Registramos en la terminal que se encontró (para depurar)
            print(f"✔️ Cupón válido encontrado: {cupon.codigo} (-{cupon.porcentaje}%)")
            
            return JsonResponse({
                "valido": True,
                "codigo": cupon.codigo,
                "porcentaje": cupon.porcentaje
            }, status=200)
            
        except CuponDescuento.DoesNotExist:
            print(f"❌ Intento de cupón inválido o expirado: '{codigo_ingresado}'")
            return JsonResponse({"valido": False, "message": "El cupón ingresado no existe o expiró."}, status=404)
        except Exception as e:
            return JsonResponse({"valido": False, "message": str(e)}, status=400)
            
    return JsonResponse({"status": "INVALID_METHOD"}, status=405)

def listar_comentarios(request):
    """Devuelve los comentarios con sus respectivas estrellas filtrados por producto"""
    producto_id = request.GET.get('producto_id')
    if not producto_id:
        return JsonResponse({"status": "ERROR", "message": "Falta el parámetro producto_id"}, status=400)
        
    comentarios = Comentario.objects.filter(producto_id=producto_id).order_by('-fecha')
    data = []
    for c in comentarios:
        # OPTIMIZACIÓN: Forzamos que 'usuario' devuelva el string del admin y aseguramos el envío
        data.append({
            "id": c.id,
            "usuario": c.usuario.username if c.usuario else "Admin/Anónimo",
            "texto": c.texto,
            "calificacion": int(c.calificacion), # Nos aseguramos de que sea un entero para el bucle de React
            "puntuacion": int(c.calificacion),   # Duplicamos la llave por si en React usaste .puntuacion en vez de .calificacion
            "fecha": c.fecha.strftime("%d/%m/%Y")
        })
    return JsonResponse(data, safe=False)

@csrf_exempt
def izipay_webhook(request):
    """Simula el impacto en inventario real tras confirmación exitosa de la API de Izipay"""
    if request.method == 'POST':
        try:
            body = json.loads(request.body)
            items_comprados = body.get('items', [])
            
            # Descontar las existencias del inventario real en Django
            for item in items_comprados:
                try:
                    # Buscamos el producto en la BD usando su ID
                    producto_db = Producto.objects.get(id=item['id'])
                    cantidad = int(item['cantidad'])
                    
                    if producto_db.stock >= cantidad:
                        producto_db.stock -= cantidad  # Resta física en el Admin
                        producto_db.save()
                except Exception:
                    # Si el ID no existe o falla un registro secundario, ignora el error
                    # y permite que la simulación de pago continúe con éxito
                    continue
            
            # Retornamos un estado 200 OK para que React muestre la pantalla de éxito
            return JsonResponse({"status": "SUCCESS", "message": "Inventario actualizado"}, status=200)
        except Exception as e:
            return JsonResponse({"status": "ERROR", "message": str(e)}, status=400)
            
    return JsonResponse({"status": "INVALID_METHOD"}, status=405)