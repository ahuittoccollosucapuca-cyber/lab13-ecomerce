from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from .models import Producto, Orden, ItemOrden

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
            "price": float(p.precio),
            "stock": p.stock,
            "imagen_url": p.imagen_url if p.imagen_url else ""
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