import React from 'react';
import { Shield, Sparkles, Globe } from 'lucide-react';

export default function ProductDetails({ productData }) {
  if (!productData) return null;

  const formattedPrice = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(productData.price || 299.90);

  return (
    <div className="slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <div className="glass-card glass-card-interactive" style={{ 
        padding: 0, 
        overflow: 'hidden', 
        borderRadius: '20px',
        position: 'relative',
        boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
        border: '1px solid rgba(255, 255, 255, 0.05)'
      }}>
        
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '80%',
          height: '60%',
          background: 'radial-gradient(circle, hsla(var(--color-primary), 0.2) 0%, transparent 60%)',
          pointerEvents: 'none',
          zIndex: 1
        }} />

        <img 
          src={productData.coverImageUrl || "/drop_sneaker.png"} 
          alt={productData.name} 
          style={{ 
            width: '100%', 
            height: 'auto', 
            maxHeight: '440px',
            objectFit: 'cover', 
            display: 'block',
            zIndex: 2,
            position: 'relative',
            transition: 'transform 0.5s ease-out'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.04)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
        />
        
      </div>

      <div className="glass-card">
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <span className="badge" style={{ background: 'rgba(124, 77, 255, 0.1)', color: 'hsl(var(--color-primary))', border: '1px solid hsla(var(--color-primary), 0.2)' }}>
            <Sparkles size={12} />
            Edição Especial
          </span>
          <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.03)', color: 'hsl(var(--color-text-muted))', border: '1px solid var(--border-glass)' }}>
            1 de 100
          </span>
        </div>

        <h1 style={{ 
          fontSize: '2rem', 
          lineHeight: '1.2', 
          marginBottom: '8px',
          background: 'linear-gradient(to right, #fff, hsl(var(--color-text-muted)))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontFamily: 'var(--font-heading)'
        }}>
          {productData.name}
        </h1>

        <div style={{ 
          fontSize: '1.8rem', 
          fontWeight: '800', 
          color: 'hsl(var(--color-secondary))', 
          marginBottom: '16px',
          fontFamily: 'var(--font-heading)'
        }}>
          {formattedPrice}
        </div>

        <p style={{ 
          fontSize: '0.95rem', 
          color: 'hsl(var(--color-text-muted))', 
          lineHeight: '1.6', 
          marginBottom: '24px' 
        }}>
          {productData.description}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', borderTop: '1px solid var(--border-glass)', paddingTop: '20px' }}>
          {[
            { icon: <Shield size={16} />, label: "Autenticidade", desc: "Verificada NFC" },
            { icon: <Globe size={16} />, label: "Frete Grátis", desc: "Todo o Brasil" },
            { icon: <Sparkles size={16} />, label: "Exclusividade", desc: "Sem Re-estoque" }
          ].map((feat, idx) => (
            <div key={idx} style={{ textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'hsl(var(--color-secondary))', marginBottom: '4px' }}>
                {feat.icon}
                <span style={{ fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{feat.label}</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))' }}>{feat.desc}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}