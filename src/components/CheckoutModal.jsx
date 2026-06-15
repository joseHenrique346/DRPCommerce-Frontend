import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, ShieldCheck, Ticket, AlertTriangle, Check, Package } from 'lucide-react';

export default function CheckoutModal({ isOpen, onClose, onSubmit, productData, isLoading, secondsToExpiry }) {
  const [slideIn, setSlideIn] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setSlideIn(true), 50);
      return () => clearTimeout(timer);
    } else {
      setSlideIn(false);
    }
  }, [isOpen]);

  const [formData, setFormData] = useState({
    fullName: 'Cliente Exemplo',
    email: 'cliente@exemplo.com',
    zipCode: '01000-000',
    addressLine: 'Rua Exemplo, 100',
    city: 'São Paulo',
    state: 'SP',
    couponCode: '',
  });

  const [appliedCoupon, setAppliedCoupon] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const basePrice = productData?.price || 299.90;
  const shipping = 20.00;
  const discount = appliedCoupon ? basePrice * 0.10 : 0.00;
  const total = basePrice + shipping - discount;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    if (formData.couponCode.trim().toUpperCase() === 'DROP10') {
      setAppliedCoupon(true);
      setCouponError('');
    } else {
      setCouponError('Cupom inválido. Tente "DROP10"');
      setAppliedCoupon(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const payload = {
      dropEventId: productData.dropEventId,
      customerId: 1,
      couponCode: appliedCoupon ? 'DROP10' : null,
      addressLine: formData.addressLine,
      city: formData.city,
      state: formData.state,
      zipCode: formData.zipCode,
    };

    try {
      const result = await onSubmit(payload);
      if (!result.isSuccess) {
        setErrorMsg(result.listMessageErrors?.[0] || "Erro desconhecido ao processar pedido.");
      }
    } catch (err) {
      setErrorMsg("Erro de comunicação com o servidor.");
    }
  };

  const formatExpiryTime = (secs) => {
    if (secs <= 0) return '00:00';
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${String(remainingSecs).padStart(2, '0')}`;
  };

  const formattedPrice = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(basePrice);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(5, 6, 8, 0.5)',
      backdropFilter: 'blur(4px)',
      zIndex: 10000,
      transition: 'opacity 0.3s ease',
    }}>
      
      <div 
        onClick={onClose} 
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', cursor: 'pointer' }} 
      />

      <div style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: '100%',
        maxWidth: '460px',
        height: '100%',
        background: '#0D1017',
        borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.7)',
        zIndex: 10001,
        display: 'flex',
        flexDirection: 'column',
        transform: slideIn ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        overflow: 'hidden',
      }}>
        
        <div style={{ 
          padding: '20px 24px', 
          borderBottom: '1px solid rgba(255,255,255,0.05)', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          background: '#121620'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '6px', background: 'rgba(124, 77, 255, 0.1)', borderRadius: '8px', color: 'hsl(var(--color-primary))' }}>
              <ShoppingBag size={18} />
            </div>
            <h3 style={{ fontSize: '1.15rem', color: '#fff', fontFamily: 'var(--font-heading)' }}>Meu Checkout prioritário</h3>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: '4px' }}
            onMouseOver={(e) => e.currentTarget.style.color = '#fff'}
            onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{
          background: secondsToExpiry <= 60 ? 'rgba(255, 23, 68, 0.12)' : 'rgba(255, 152, 0, 0.08)',
          borderBottom: secondsToExpiry <= 60 ? '1px solid rgba(255, 23, 68, 0.25)' : '1px solid rgba(255, 152, 0, 0.15)',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.8rem',
        }}>
          <span style={{ color: 'hsl(var(--color-text-muted))', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={14} style={{ color: secondsToExpiry <= 60 ? '#FF1744' : 'hsl(var(--color-warning))' }} />
            Finalize antes de expirar a vaga:
          </span>
          <span style={{ 
            fontFamily: 'monospace', 
            fontSize: '1rem', 
            fontWeight: 'bold', 
            color: secondsToExpiry <= 60 ? '#FF1744' : 'hsl(var(--color-warning))',
            textShadow: '0 0 10px rgba(255, 152, 0, 0.1)'
          }}>
            {formatExpiryTime(secondsToExpiry)}
          </span>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
            padding: '12px',
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            marginBottom: '24px'
          }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', background: '#050608', flexShrink: 0 }}>
              <img src={productData?.coverImageUrl || "/drop_sneaker.png"} alt={productData?.name || "Product"} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ flex: 1 }}>
              <span className="badge" style={{ padding: '2px 8px', fontSize: '0.6rem', background: 'rgba(0, 229, 255, 0.1)', color: 'hsl(var(--color-secondary))', marginBottom: '4px' }}>
                RESERVADO
              </span>
              <h4 style={{ fontSize: '0.9rem', color: '#fff', marginBottom: '2px' }}>{productData?.name || "Product"}</h4>
              <div style={{ fontSize: '0.8rem', color: 'hsl(var(--color-text-muted))' }}>SKU: {productData?.sku || "N/A"}</div>
            </div>
            <div style={{ fontWeight: 'bold', fontSize: '1rem', color: '#fff' }}>
              {formattedPrice}
            </div>
          </div>

          {errorMsg && (
            <div style={{ background: 'rgba(255, 23, 68, 0.08)', border: '1px solid rgba(255, 23, 68, 0.2)', padding: '12px', borderRadius: '10px', fontSize: '0.85rem', color: '#FF5252', marginBottom: '16px' }}>
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div>
              <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'hsl(var(--color-text-muted))', display: 'block', marginBottom: '6px' }}>Nome Completo</label>
              <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required className="input-field" />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'hsl(var(--color-text-muted))', display: 'block', marginBottom: '6px' }}>E-mail</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required className="input-field" />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'hsl(var(--color-text-muted))', display: 'block', marginBottom: '6px' }}>Endereço de Entrega</label>
              <input type="text" name="addressLine" value={formData.addressLine} onChange={handleChange} required className="input-field" placeholder="Rua, número, bloco, apto" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 0.8fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'hsl(var(--color-text-muted))', display: 'block', marginBottom: '6px' }}>CEP</label>
                <input type="text" name="zipCode" value={formData.zipCode} onChange={handleChange} required className="input-field" />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'hsl(var(--color-text-muted))', display: 'block', marginBottom: '6px' }}>Cidade</label>
                <input type="text" name="city" value={formData.city} onChange={handleChange} required className="input-field" />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'hsl(var(--color-text-muted))', display: 'block', marginBottom: '6px' }}>UF</label>
                <input type="text" name="state" value={formData.state} onChange={handleChange} required className="input-field" maxLength={2} />
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '16px', marginTop: '8px' }}>
              <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'hsl(var(--color-text-muted))', display: 'block', marginBottom: '6px' }}>Cupom de Desconto</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  name="couponCode" 
                  value={formData.couponCode} 
                  onChange={handleChange} 
                  className="input-field" 
                  placeholder="Ex: DROP10"
                  disabled={appliedCoupon} 
                />
                <button 
                  type="button" 
                  onClick={handleApplyCoupon} 
                  disabled={appliedCoupon || !formData.couponCode}
                  className="btn" 
                  style={{ width: 'auto', whiteSpace: 'nowrap', padding: '0 16px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-glass)' }}
                >
                  {appliedCoupon ? <Check size={16} style={{ color: 'hsl(var(--color-success))' }} /> : "Aplicar"}
                </button>
              </div>
              {couponError && <p style={{ fontSize: '0.75rem', color: '#FF5252', marginTop: '4px' }}>{couponError}</p>}
              {appliedCoupon && <p style={{ fontSize: '0.75rem', color: 'hsl(var(--color-success))', marginTop: '4px' }}>Cupom DROP10 aplicado! Desconto de 10% ativo.</p>}
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)', marginTop: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'hsl(var(--color-text-muted))', marginBottom: '8px' }}>
                <span>Preço Base</span>
                <span>R$ {basePrice.toFixed(2).replace('.', ',')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'hsl(var(--color-text-muted))', marginBottom: '8px' }}>
                <span>Frete Sedex</span>
                <span>R$ {shipping.toFixed(2).replace('.', ',')}</span>
              </div>
              {appliedCoupon && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'hsl(var(--color-success))', marginBottom: '8px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Ticket size={12} /> Cupom (10%)</span>
                  <span>- R$ {discount.toFixed(2).replace('.', ',')}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', fontWeight: '800', color: '#fff', borderTop: '1px solid var(--border-glass)', paddingTop: '10px', marginTop: '10px' }}>
                <span>Total Geral</span>
                <span style={{ color: 'hsl(var(--color-secondary))' }}>R$ {total.toFixed(2).replace('.', ',')}</span>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading} 
              className="btn btn-primary pulse-glow"
              style={{ background: 'linear-gradient(135deg, hsl(var(--color-primary)), hsl(var(--color-accent)))', marginTop: '8px' }}
            >
              {isLoading ? (
                <div className="spinner" style={{ width: '18px', height: '18px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              ) : (
                <>
                  <ShieldCheck size={16} />
                  Confirmar Pedido Prioritário
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}