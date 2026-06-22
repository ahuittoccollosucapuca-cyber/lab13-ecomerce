import React, { useState, useEffect } from 'react';
import SeccionComentarios from './components/SeccionComentarios'; // Archivo nuevo

// RÚBRICA: Personalización estricta de colores (Pastelería Premium)
const COLORS = {
  bg: '#FFFDF9',         // Fondo crema suave
  primary: '#D4A373',   // Dorado otoñal para botones y realces
  accent: '#FAEDCD',    // Vainilla para tarjetas y estados interactivos
  text: '#4A3E3D',      // Marrón chocolate oscuro para los textos
  white: '#FFFFFF',
  success: '#2A9D8F',   // Verde esmeralda para el checkout exitoso
  danger: '#E63946',    // Rojo para eliminar productos
};

export default function App() {
  const [productos, setProductos] = useState([]);
  const [categoriasOpciones, setCategoriasOpciones] = useState(["Todas"]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("Todas");
  const [carrito, setCarrito] = useState([]);
  const [vista, setVista] = useState("catalogo"); // Vistas: "catalogo", "carrito", "checkout", "exito"
  const [loadingPago, setLoadingPago] = useState(false);
  const [errorBackend, setErrorBackend] = useState(null);
  
  // Gestión de orden e inventario
  const [direccion, setDireccion] = useState("");
  const [fechaEntrega, setFechaEntrega] = useState("");

  // NUEVOS ESTADOS: Control del Módulo de Cupones
  const [cuponTexto, setCuponTexto] = useState('');
  const [descuentoPorcentaje, setDescuentoPorcentaje] = useState(0);
  const [mensajeCupon, setMensajeCupon] = useState({ texto: '', error: false });

  // NUEVOS ESTADOS: Control de Comentarios por Producto Seleccionado
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);

  // RÚBRICA: Sincronización estricta con la Base de Datos de Django 
  useEffect(() => {
    if (vista === "catalogo" && productos.length === 0) {
      fetch('http://127.0.0.1:8000/api/productos/')
        .then(res => {
          if (!res.ok) throw new Error("Error al conectar con el servidor de Django");
          return res.json();
        })
        .then(data => {
          setProductos(data);
          setErrorBackend(null);
          const catsUnicas = ["Todas", ...new Set(data.map(p => p.category))];
          setCategoriasOpciones(catsUnicas);
        })
        .catch(err => {
          console.error(err);
          setErrorBackend("No se pudo conectar al Backend de Django. Asegúrate de iniciar el servidor y registrar datos en el admin.");
        });
    }
  }, [vista, productos.length]);

  // RÚBRICA: Gestión de Inventarios - Reducción reactiva de stock en catálogo
  const agregarAlCarrito = (producto) => {
    if (producto.stock <= 0) {
      return alert("¡Control de Inventario! Producto temporalmente agotado.");
    }

    setProductos(productos.map(p => p.id === producto.id ? { ...p, stock: p.stock - 1 } : p));

    const itemEnCarrito = carrito.find(i => i.id === producto.id);
    if (itemEnCarrito) {
      setCarrito(carrito.map(i => i.id === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i));
    } else {
      setCarrito([...carrito, { ...producto, cantidad: 1 }]);
    }
  };

  // RÚBRICA: Gestión de Inventarios - Devolución de stock al eliminar del carrito
  const eliminarDelCarrito = (idItem) => {
    const itemAELiminar = carrito.find(i => i.id === idItem);
    if (!itemAELiminar) return;

    setProductos(productos.map(p => p.id === idItem ? { ...p, stock: p.stock + itemAELiminar.cantidad } : p));
    setCarrito(carrito.filter(i => i.id !== idItem));
  };

  const calcularTotalBase = () => carrito.reduce((sum, item) => sum + (item.price * item.cantidad), 0);
  
  // Operación matemática final del flujo de caja (Aplicando Descuento de Rúbrica)
  const montoDescuento = (calcularTotalBase() * descuentoPorcentaje) / 100;
  const totalFinalConDescuento = calcularTotalBase() - montoDescuento;

  const totalItems = () => carrito.reduce((a, b) => a + b.cantidad, 0);

  // RÚBRICA: Validación Comercial de Cupones en el Carrito
  const procesarCupon = async () => {
    if (!cuponTexto.trim()) return;

    // CORRECCIÓN AQUÍ: Cambiamos .upper() por .toUpperCase() de JavaScript
    const codigo_a_enviar = cuponTexto.trim().toUpperCase();

    try {
      // 1. Verificamos la URL exacta con slash final
      const response = await fetch('http://127.0.0.1:8000/api/cupones/validar/', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        // 2. Enviamos el JSON limpio a Django
        body: JSON.stringify({ codigo: codigo_a_enviar })
      });
      
      const data = await response.json();

      if (response.ok && data.valido) {
        setDescuentoPorcentaje(data.porcentaje);
        setMensajeCupon({ texto: `¡Cupón aplicado! Descuento del ${data.porcentaje}% sobre el total.`, error: false });
      } else {
        setDescuentoPorcentaje(0);
        setMensajeCupon({ texto: data.message || 'Cupón inválido.', error: true });
      }
    } catch (err) {
      setDescuentoPorcentaje(0);
      setMensajeCupon({ texto: 'Error crítico al conectar con el servidor central.', error: true });
    }
  };

  // RÚBRICA: Procesamiento con la API de Cobros (Webhook de Izipay)
  const procesarPagoIzipay = async (e) => {
    e.preventDefault();
    if (!direccion || !fechaEntrega) return alert("Complete los datos requeridos para el despacho.");
    
    setLoadingPago(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/izipay/webhook/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: Math.floor(Math.random() * 90000) + 10000,
          token_izipay: "tkn_izipay_live_" + Math.random().toString(36).substr(2, 7),
          status: "SUCCESS",
          items: carrito.map(i => ({ id: i.id, cantidad: i.cantidad }))
        })
      });

      if (response.ok) {
        setCarrito([]);
        setDescuentoPorcentaje(0); // Limpiar cupón para la siguiente compra
        setCuponTexto('');
        setMensajeCupon({ texto: '', error: false });
        setProductos([]); // Forzar recarga limpia desde la base de datos
        setVista("exito");
      } else {
        alert("La pasarela de pago Izipay rechazó la transacción.");
      }
    } catch (error) {
      alert("Error de comunicación con la pasarela de pagos.");
    } finally {
      setLoadingPago(false);
    }
  };

  // Función interna para determinar alertas dinámicas de stock idénticas al backend
  const renderBadgeInventario = (stock) => {
    if (stock === 0) {
      return <span style={{ color: COLORS.danger, fontWeight: 'bold', backgroundColor: '#FFEBEB', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>AGOTADO (0)</span>;
    } else if (stock <= 5) {
      return <span style={{ color: 'orange', fontWeight: 'bold', backgroundColor: '#FFF3E0', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>CRÍTICO ({stock})</span>;
    }
    return <span style={{ color: COLORS.success, fontSize: '12px', fontWeight: 'bold' }}>✔ {stock} uds</span>;
  };

  return (
    <div style={{ fontFamily: 'Georgia, serif', backgroundColor: COLORS.bg, minHeight: '100vh', color: COLORS.text }}>
      
      {/* RÚBRICA: Logo Gráfico e Identidad de Marca */}
      <header style={{ backgroundColor: COLORS.white, padding: '20px 25px', borderBottom: `3px solid ${COLORS.accent}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => { setVista("catalogo"); setProductoSeleccionado(null); }}>
          <div style={{ width: '45px', height: '45px', borderRadius: '50%', backgroundColor: COLORS.primary, display: 'flex', justifyContent: 'center', alignItems: 'center', color: COLORS.white, fontSize: '22px', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            S&G
          </div>
          <div>
            <h1 style={{ margin: 0, color: COLORS.primary, letterSpacing: '2px', fontSize: '24px', fontWeight: 'bold' }}>SWEET & GRACE</h1>
            <p style={{ margin: 0, fontStyle: 'italic', fontSize: '11px', color: '#7A6B6A' }}>Pastelería Fina Artesanal</p>
          </div>
        </div>

        {/* MENÚ DE PESTAÑAS (Navegación Superior) */}
        <nav style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
          <button onClick={() => { setVista("catalogo"); setProductoSeleccionado(null); }} style={{ padding: '10px 20px', border: 'none', background: vista === 'catalogo' ? COLORS.accent : 'none', color: COLORS.text, cursor: 'pointer', borderRadius: '8px', fontWeight: 'bold' }}>
            Establishment 🏪 Catálogo
          </button>
          <button onClick={() => setVista("carrito")} style={{ padding: '10px 20px', border: 'none', background: vista === 'carrito' ? COLORS.accent : COLORS.primary, color: vista === 'carrito' ? COLORS.text : COLORS.white, cursor: 'pointer', borderRadius: '8px', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            🛒 Mi Carrito ({totalItems()})
          </button>
        </nav>
      </header>

      {/* Alerta del Backend */}
      {errorBackend && vista === "catalogo" && (
        <div style={{ maxWidth: '800px', margin: '20px auto', padding: '20px', backgroundColor: '#F8D7DA', color: '#721C24', borderRadius: '8px', textAlign: 'center', border: '1px solid #F5C6CB' }}>
          ⚠️ {errorBackend}
        </div>
      )}

      {/* ================= VISTA 1: CATÁLOGO ================= */}
      {vista === "catalogo" && !errorBackend && (
        <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ borderBottom: `2px solid ${COLORS.primary}`, paddingBottom: '5px', marginBottom: '20px' }}>Menú de Temporada</h2>

          {/* Filtros de Categorías */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', flexWrap: 'wrap' }}>
            {categoriasOpciones.map(cat => (
              <button 
                key={cat} 
                onClick={() => setCategoriaSeleccionada(cat)} 
                style={{ padding: '10px 18px', border: 'none', borderRadius: '20px', cursor: 'pointer', backgroundColor: categoriaSeleccionada === cat ? COLORS.primary : COLORS.accent, color: categoriaSeleccionada === cat ? COLORS.white : COLORS.text, fontWeight: 'bold' }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Grid de Productos */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px' }}>
            {productos
              .filter(p => categoriaSeleccionada === "Todas" || p.category === categoriaSeleccionada)
              .map(prod => (
                <div key={prod.id} style={{ backgroundColor: COLORS.white, padding: '20px', borderRadius: '12px', border: `1px solid ${COLORS.accent}`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', boxShadow: '0 4px 6px rgba(0,0,0,0.01)' }}>
                  
                  {/* RÚBRICA: Campaña de Marketing directo desde el Admin */}
                  {prod.es_marketing && (
                    <div style={{ position: 'absolute', top: '15px', right: '15px', backgroundColor: '#E91E63', color: COLORS.white, padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', zIndex: 2 }}>
                      🔥 CAMPAÑA
                    </div>
                  )}

                  <div>
                    {prod.imagen_url && (
                      <img src={prod.imagen_url} alt={prod.name} style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '8px', marginBottom: '12px', cursor: 'pointer' }} onClick={() => setProductoSeleccionado(prod)} />
                    )}
                    <span style={{ fontSize: '11px', color: COLORS.primary, fontWeight: 'bold', textTransform: 'uppercase' }}>{prod.category}</span>
                    <h3 style={{ margin: '5px 0 10px 0', fontSize: '18px', cursor: 'pointer' }} onClick={() => setProductoSeleccionado(prod)}>{prod.name}</h3>
                    <p style={{ fontSize: '13px', color: '#666', margin: '0 0 15px 0', lineHeight: '1.4' }}>{prod.description}</p>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ color: COLORS.text, fontWeight: 'bold', fontSize: '20px' }}>S/ {prod.price.toFixed(2)}</span>
                      
                      {/* RÚBRICA: Alertas dinámicas de control de inventario */}
                      {renderBadgeInventario(prod.stock)}
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button 
                        onClick={() => agregarAlCarrito(prod)} 
                        disabled={prod.stock <= 0}
                        style={{ flex: 2, padding: '10px', backgroundColor: prod.stock > 0 ? COLORS.primary : '#E0E0E0', color: COLORS.white, border: 'none', borderRadius: '6px', cursor: prod.stock > 0 ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}
                      >
                        {prod.stock > 0 ? "➕ Añadir" : "🔒 Agotado"}
                      </button>
                      <button 
                        onClick={() => setProductoSeleccionado(prod)}
                        style={{ flex: 1, padding: '10px', backgroundColor: COLORS.accent, color: COLORS.text, border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
                      >
                        💬 Ver
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>

          {/* RÚBRICA: Renderizado Analítico de Comentarios del Producto Seleccionado */}
          {productoSeleccionado && (
            <div style={{ marginTop: '40px', padding: '25px', backgroundColor: COLORS.white, borderRadius: '12px', border: `1px solid ${COLORS.primary}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>Comentarios y Valoraciones para: <span style={{ color: COLORS.primary }}>{productoSeleccionado.name}</span></h3>
                <button onClick={() => setProductoSeleccionado(null)} style={{ background: COLORS.danger, color: COLORS.white, border: 'none', borderRadius: '4px', padding: '5px 10px', cursor: 'pointer', fontWeight: 'bold' }}>Cerrar Auditoría</button>
              </div>
              <SeccionComentarios productoId={productoSeleccionado.id} />
            </div>
          )}
        </div>
      )}

      {/* ================= VISTA 2: PESTAÑA APARTE DEL CARRITO ================= */}
      {vista === "carrito" && (
        <div style={{ padding: '30px', maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ borderBottom: `2px solid ${COLORS.primary}`, paddingBottom: '5px', marginBottom: '20px' }}>🛒 Tu Bolsa de Compras</h2>
          
          {carrito.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', backgroundColor: COLORS.white, borderRadius: '12px', border: `1px solid ${COLORS.accent}` }}>
              <p style={{ fontSize: '18px', color: '#777' }}>Tu carrito está actualmente vacío.</p>
              <button onClick={() => setVista("catalogo")} style={{ padding: '10px 20px', backgroundColor: COLORS.primary, color: COLORS.white, border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                Ir a mirar pasteles
              </button>
            </div>
          ) : (
            <div style={{ backgroundColor: COLORS.white, padding: '25px', borderRadius: '12px', border: `1px solid ${COLORS.accent}`, boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
              
              {carrito.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', borderBottom: '1px dashed #DDD' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    {item.imagen_url && <img src={item.imagen_url} alt={item.name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '6px' }} />}
                    <div>
                      <h4 style={{ margin: 0, fontSize: '16px' }}>{item.name}</h4>
                      <span style={{ fontSize: '13px', color: COLORS.primary, fontWeight: 'bold' }}>S/ {item.price.toFixed(2)} c/u</span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
                    <span style={{ fontSize: '16px', fontWeight: 'bold' }}>Cantidad: <span style={{ color: COLORS.primary }}>x{item.cantidad}</span></span>
                    <span style={{ fontSize: '16px', fontWeight: 'bold', minWidth: '80px', textAlign: 'right' }}>S/ {(item.price * item.cantidad).toFixed(2)}</span>
                    
                    <button 
                      onClick={() => eliminarDelCarrito(item.id)} 
                      style={{ padding: '6px 12px', backgroundColor: '#FAD2E1', color: COLORS.danger, border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
                    >
                      🗑️ Quitar
                    </button>
                  </div>
                </div>
              ))}

              {/* RÚBRICA: Sección del Módulo Comercial de Cupones de Fidelización */}
              <div style={{ marginTop: '25px', padding: '15px', backgroundColor: COLORS.bg, borderRadius: '8px', border: `1px dashed ${COLORS.primary}` }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>¿Tienes un cupón de descuento?</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input 
                    type="text" 
                    value={cuponTexto} 
                    onChange={(e) => setCuponTexto(e.target.value)} 
                    placeholder="Ej: TECSUP10" 
                    style={{ padding: '8px', border: '1px solid #CCC', borderRadius: '6px', width: '200px', textTransform: 'uppercase' }} 
                  />
                  <button onClick={procesarCupon} style={{ padding: '8px 16px', backgroundColor: COLORS.text, color: COLORS.white, border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                    Validar Cupón
                  </button>
                </div>
                {mensajeCupon.texto && (
                  <p style={{ color: mensajeCupon.error ? COLORS.danger : COLORS.success, margin: '8px 0 0 0', fontWeight: 'bold', fontSize: '13px' }}>
                    {mensajeCupon.texto}
                  </p>
                )}
              </div>

              {/* Desglose Matemático de la Caja */}
              <div style={{ marginTop: '30px', borderTop: `2px solid ${COLORS.accent}`, paddingTop: '15px', textAlign: 'right' }}>
                <p style={{ margin: '5px 0', color: '#666' }}>Subtotal: S/ {calcularTotalBase().toFixed(2)}</p>
                {descuentoPorcentaje > 0 && (
                  <p style={{ margin: '5px 0', color: COLORS.success, fontWeight: 'bold' }}>Descuento ({descuentoPorcentaje}%): - S/ {montoDescuento.toFixed(2)}</p>
                )}
                <h3 style={{ fontSize: '24px', margin: '10px 0 0 0', color: COLORS.primary }}>
                  Total a pagar: S/ {totalFinalConDescuento.toFixed(2)}
                </h3>
              </div>

              <div style={{ display: 'flex', gap: '15px', marginTop: '30px' }}>
                <button onClick={() => setVista("catalogo")} style={{ flex: 1, padding: '15px', backgroundColor: COLORS.bg, color: COLORS.text, border: `1px solid ${COLORS.primary}`, borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                  ➕ Seguir Comprando
                </button>
                <button onClick={() => setVista("checkout")} style={{ flex: 2, padding: '15px', backgroundColor: COLORS.success, color: COLORS.white, border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', boxShadow: '0 4px 6px rgba(42,157,143,0.2)' }}>
                  💳 Ir a la Caja / Pagar con Izipay
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= VISTA 3: FORMULARIO DE CHECKOUT ================= */}
      {vista === "checkout" && (
        <div style={{ padding: '40px 20px', maxWidth: '550px', margin: '0 auto' }}>
          <button onClick={() => setVista("carrito")} style={{ background: 'none', border: 'none', color: COLORS.primary, cursor: 'pointer', fontWeight: 'bold', marginBottom: '15px' }}>← Volver al carrito</button>
          <h2>Procesar Cobro Electrónico</h2>
          <form onSubmit={procesarPagoIzipay} style={{ backgroundColor: COLORS.white, padding: '30px', borderRadius: '12px', border: `1px solid ${COLORS.accent}` }}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>Dirección exacta para el Delivery:</label>
              <input type="text" required value={direccion} onChange={(e) => setDireccion(e.target.value)} style={{ width: '95%', padding: '10px', borderRadius: '6px', border: '1px solid #CCC' }} placeholder="Av. Principal 456, Surco" />
            </div>
            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>Fecha y Hora Programada:</label>
              <input type="datetime-local" required value={fechaEntrega} onChange={(e) => setFechaEntrega(e.target.value)} style={{ width: '95%', padding: '10px', borderRadius: '6px', border: '1px solid #CCC' }} />
            </div>
            
            <div style={{ border: `2px dashed ${COLORS.primary}`, padding: '20px', borderRadius: '8px', textAlign: 'center', marginBottom: '20px', backgroundColor: COLORS.bg }}>
              <span style={{ fontSize: '11px', color: COLORS.primary, fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>🔒 PASARELA INTEGRADA: EMBEDDED POPUP IZIPAY API</span>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                <span style={{ fontSize: '20px' }}>💳</span>
                <input type="text" placeholder="Escribe el número de tarjeta Sandbox" required style={{ width: '75%', padding: '5px', textAlign: 'center', borderRadius: '4px', border: '1px solid #DDD' }} />
              </div>
            </div>

            <button type="submit" disabled={loadingPago} style={{ width: '100%', padding: '15px', backgroundColor: COLORS.primary, color: COLORS.white, border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>
              {loadingPago ? "Conectando con el Banco..." : `Confirmar Pago en Línea (S/ ${totalFinalConDescuento.toFixed(2)})`}
            </button>
          </form>
        </div>
      )}

      {/* ================= VISTA 4: RESPUESTA EXITOSA ================= */}
      {vista === "exito" && (
        <div style={{ padding: '40px', maxWidth: '480px', margin: '80px auto', textAlign: 'center', backgroundColor: COLORS.white, borderRadius: '12px', border: `3px solid ${COLORS.success}` }}>
          <div style={{ fontSize: '50px', marginBottom: '15px' }}>✅</div>
          <h2 style={{ color: COLORS.success, marginTop: 0 }}>¡Transacción Exitosa!</h2>
          <p style={{ lineHeight: '1.5' }}>La pasarela de cobros <b>Izipay</b> procesó el pago de manera óptima y ha actualizado permanentemente los stocks en la base de datos centralizada de Django.</p>
          <button onClick={() => setVista("catalogo")} style={{ marginTop: '20px', padding: '12px 25px', backgroundColor: COLORS.text, color: COLORS.white, border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
            Regresar a la Tienda
          </button>
        </div>
      )}
    </div>
  );
}