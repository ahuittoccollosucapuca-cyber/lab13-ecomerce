import React, { useState, useEffect } from 'react';

export default function SeccionComentarios({ productoId }) {
  const [comentarios, setComentarios] = useState([]);

  useEffect(() => {
    if (!productoId) return;
    
    fetch(`http://127.0.0.1:8000/api/comentarios/?producto_id=${productoId}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setComentarios(data);
        }
      })
      .catch(err => console.error("Error al auditar comentarios:", err));
  }, [productoId]);

  // Transforma la calificación numérica en caracteres de estrellas idénticas al admin
  const renderEstrellas = (calificacion) => {
    // 🚨 CORRECCIÓN CRÍTICA: Sanitizamos el valor para asegurar que sea un entero válido entre 0 y 5
    const numEstrellas = Math.min(Math.max(parseInt(calificacion, 10) || 0, 0), 5);
    
    const llenas = "★".repeat(numEstrellas);
    const vacias = "☆".repeat(5 - numEstrellas);
    
    return (
      <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
        <span style={{ color: 'gold' }}>{llenas}</span>
        <span style={{ color: '#CCC' }}>{vacias}</span>
      </span>
    );
  };

  return (
    <div style={{ marginTop: '15px' }}>
      {comentarios.length === 0 ? (
        <p style={{ color: '#888', fontStyle: 'italic', fontSize: '14px' }}>
          Aún no existen opiniones o reseñas registradas para este producto en el sistema.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {comentarios.map(com => (
            <div key={com.id} style={{ borderBottom: '1px dashed #E0DCD5', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {/* Lee de manera segura la propiedad usuario devuelta por la vista optimizada */}
                <strong>👤 {com.usuario}</strong>
                <small style={{ color: '#999' }}>{com.fecha}</small>
              </div>
              <div style={{ margin: '4px 0' }}>{renderEstrellas(com.calificacion)}</div>
              <p style={{ margin: 0, fontSize: '14px', color: '#555', fontStyle: 'italic' }}>
                "{com.texto}"
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}