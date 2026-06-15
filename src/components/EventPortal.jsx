import React, { useState, useEffect } from 'react';
import { Layers, ShoppingBag, Clock, Sparkles, ArrowRight } from 'lucide-react';
import { getVirtualTime } from '../services/api';

export default function EventPortal({ events, onSelectEvent, virtualTime }) {
  return (
    <div className="slide-up">
      
      <div className="glass-card" style={{ 
        marginBottom: '40px',
        background: 'linear-gradient(135deg, rgba(124, 77, 255, 0.08), rgba(0, 229, 255, 0.05)), var(--bg-card-glass)',
        borderLeft: '4px solid hsl(var(--color-primary))',
        padding: '30px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Sparkles size={16} style={{ color: 'hsl(var(--color-secondary))' }} />
          <span style={{ fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.05em', color: 'hsl(var(--color-text-muted))', textTransform: 'uppercase' }}>
            Lançamentos Limitados
          </span>
        </div>
        <h2 style={{ fontSize: '1.8rem', color: '#fff', marginBottom: '8px', fontFamily: 'var(--font-heading)' }}>
          Hypebeast Waiting Room Portal
        </h2>
        <p style={{ fontSize: '0.9rem', color: 'hsl(var(--color-text-muted))', maxWidth: '600px', lineHeight: '1.6' }}>
          Monitore cronômetros, garanta sua vaga nas filas de espera de alta prioridade e acesse compras exclusivas de unidades extremamente limitadas.
        </p>
      </div>

      <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <ShoppingBag size={18} style={{ color: 'hsl(var(--color-primary))' }} />
        Drops Disponíveis
      </h3>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '30px'
      }}>
        {events.map((ev) => (
          <EventCard key={ev.id} event={ev} onSelect={onSelectEvent} virtualTime={virtualTime} />
        ))}
      </div>
    </div>
  );
}

function EventCard({ event, onSelect, virtualTime }) {
  const [status, setStatus] = useState({ label: '', badgeClass: '', timeStr: '' });

  useEffect(() => {
    const calculateCardStatus = () => {
      const now = new Date(virtualTime);
      const queueOpens = new Date(event.queueOpensAt);
      const dropStarts = new Date(event.dropStartsAt);
      const dropEnds = new Date(event.dropEndsAt);
      const hasPurchased = localStorage.getItem(`veloce_order_success_${event.id}`) !== null;

      if (hasPurchased) {
        setStatus({
          label: 'Adquirido',
          badgeClass: 'badge-success pulse-scale',
          timeStr: 'Unidade adquirida com sucesso!'
        });
        return;
      }

      if (now < queueOpens) {
        const diff = queueOpens - now;
        setStatus({
          label: 'Fila em Breve',
          badgeClass: 'badge-ended',
          timeStr: `Fila abre em: ${formatCountdown(diff)}`
        });
      } else if (now < dropStarts) {
        const diff = dropStarts - now;
        setStatus({
          label: 'Fila Ativa',
          badgeClass: 'badge-waiting pulse-glow',
          timeStr: `Drop inicia em: ${formatCountdown(diff)}`
        });
      } else if (now < dropEnds) {
        setStatus({
          label: 'LIVE NOW',
          badgeClass: 'badge-live pulse-scale',
          timeStr: 'Drop liberado!'
        });
      } else {
        setStatus({
          label: 'Encerrado',
          badgeClass: 'badge-ended',
          timeStr: 'Evento concluído.'
        });
      }
    };

    calculateCardStatus();
    const timer = setInterval(calculateCardStatus, 1000);
    return () => clearInterval(timer);
  }, [event, virtualTime]);

  const formatCountdown = (diffMs) => {
    if (diffMs <= 0) return '00:00';
    const totalSecs = Math.floor(diffMs / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const formattedPrice = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(event.price);

  const isSoldOut = event.unitsSold >= event.totalUnitsAvailable;
  const isEnded = new Date(virtualTime) >= new Date(event.dropEndsAt);

  const hasPurchased = localStorage.getItem(`veloce_order_success_${event.id}`) !== null;

  return (
    <div className="glass-card glass-card-interactive" style={{ 
      padding: 0,
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      borderRadius: '16px',
      overflow: 'hidden',
      border: '1px solid rgba(255, 255, 255, 0.05)',
      boxShadow: '0 10px 30px rgba(0,0,0,0.4)'
    }}>
      
      <div style={{ height: '180px', overflow: 'hidden', position: 'relative', background: '#07080a' }}>
        <img 
          src={event.coverImageUrl} 
          alt={event.name} 
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s' }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
        />
        
        <div style={{ position: 'absolute', top: '15px', right: '15px', zIndex: 10 }}>
          <span className={`badge ${status.badgeClass}`}>{status.label}</span>
        </div>
      </div>

      <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <h4 style={{ color: '#fff', fontSize: '1.2rem', fontFamily: 'var(--font-heading)', marginBottom: '4px' }}>
            {event.name}
          </h4>
          <div style={{ color: 'hsl(var(--color-secondary))', fontWeight: 'bold', fontSize: '1.1rem' }}>
            {formattedPrice}
          </div>
        </div>

        <p style={{ fontSize: '0.8rem', color: 'hsl(var(--color-text-muted))', lineHeight: '1.5', flex: 1 }}>
          {event.description.length > 105 ? `${event.description.substr(0, 105)}...` : event.description}
        </p>

        <div style={{ marginTop: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'hsl(var(--color-text-muted))', marginBottom: '4px' }}>
            <span>Estoque</span>
            <span>{isSoldOut ? 'ESGOTADO' : `${event.totalUnitsAvailable - event.unitsSold} restam de ${event.totalUnitsAvailable}`}</span>
          </div>
          <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.03)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ 
              height: '100%', 
              width: `${(event.unitsSold / event.totalUnitsAvailable) * 100}%`,
              background: isSoldOut ? 'red' : 'linear-gradient(90deg, hsl(var(--color-primary)), hsl(var(--color-secondary)))'
            }} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#fff', background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)', marginTop: '4px' }}>
          <Clock size={12} style={{ color: 'hsl(var(--color-secondary))' }} />
          <span>{status.timeStr}</span>
        </div>

        <button 
          onClick={() => onSelect(event.id)} 
          className="btn btn-secondary"
          style={{ 
            marginTop: '8px', 
            background: hasPurchased 
              ? 'rgba(76, 175, 80, 0.1)' 
              : isEnded 
              ? 'rgba(255,255,255,0.02)' 
              : 'linear-gradient(135deg, rgba(124, 77, 255, 0.1), rgba(0, 229, 255, 0.05))',
            borderColor: hasPurchased 
              ? 'rgba(76, 175, 80, 0.3)' 
              : isEnded 
              ? 'var(--border-glass)' 
              : 'rgba(124, 77, 255, 0.2)',
            color: hasPurchased ? 'hsl(var(--color-success))' : 'inherit',
            fontSize: '0.8rem',
            padding: '10px'
          }}
          onMouseOver={(e) => {
            if (hasPurchased) {
              e.currentTarget.style.background = 'rgba(76, 175, 80, 0.15)';
            } else if (!isEnded) {
              e.currentTarget.style.borderColor = 'hsl(var(--color-primary))';
              e.currentTarget.style.color = '#fff';
            }
          }}
          onMouseOut={(e) => {
            if (hasPurchased) {
              e.currentTarget.style.background = 'rgba(76, 175, 80, 0.1)';
            } else if (!isEnded) {
              e.currentTarget.style.borderColor = 'rgba(124, 77, 255, 0.2)';
              e.currentTarget.style.color = 'hsl(var(--color-text-main))';
            }
          }}
        >
          {hasPurchased ? "Ver Comprovante" : isEnded ? "Ver Resultados" : "Entrar no Drop"}
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}