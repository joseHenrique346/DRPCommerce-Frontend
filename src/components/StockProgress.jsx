import React, { useEffect, useState } from 'react';
import { Package, AlertCircle } from 'lucide-react';

export default function StockProgress({ unitsAllocated = 100, unitsSold = 0 }) {
  const [prevSold, setPrevSold] = useState(unitsSold);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (unitsSold > prevSold) {
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 800);
      setPrevSold(unitsSold);
      return () => clearTimeout(timer);
    }
  }, [unitsSold, prevSold]);

  const total = Math.max(1, unitsAllocated);
  const sold = Math.max(0, Math.min(unitsSold, total));
  const available = total - sold;
  const percentageSold = Math.round((sold / total) * 100);

  const getTheme = () => {
    if (available === 0) {
      return {
        color: 'hsl(var(--color-danger))',
        label: 'ESGOTADO',
        glow: 'rgba(255, 23, 68, 0.4)',
      };
    }
    if (available <= 10) {
      return {
        color: 'hsl(var(--color-danger))',
        label: 'ESTOQUE CRÍTICO',
        glow: 'rgba(255, 23, 68, 0.4)',
        alert: true,
      };
    }
    if (available <= 50) {
      return {
        color: 'hsl(var(--color-warning))',
        label: 'POUCAS UNIDADES',
        glow: 'rgba(255, 152, 0, 0.3)',
      };
    }
    return {
      color: 'hsl(var(--color-secondary))',
      label: 'ESTOQUE DISPONÍVEL',
      glow: 'rgba(0, 229, 255, 0.3)',
    };
  };

  const theme = getTheme();

  return (
    <div className={`glass-card slide-up ${pulse ? 'pulse-scale' : ''}`} style={{ 
      animationDelay: '0.15s',
      borderLeft: `4px solid ${theme.color}`
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Package size={16} style={{ color: theme.color }} />
          <span style={{ fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.05em', color: theme.color }}>
            {theme.label}
          </span>
        </div>
        <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#fff' }}>
          {available === 0 ? '0 unidades' : `${available} restam de ${total}`}
        </span>
      </div>

      <div style={{ 
        width: '100%', 
        height: '10px', 
        background: 'rgba(255, 255, 255, 0.03)', 
        borderRadius: '9999px',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        marginBottom: '14px'
      }}>
        <div style={{ 
          height: '100%', 
          width: `${percentageSold}%`, 
          background: available === 0 
            ? 'linear-gradient(90deg, #FF1744, #D50000)' 
            : `linear-gradient(90deg, hsl(var(--color-primary)), ${theme.color})`, 
          borderRadius: '9999px',
          boxShadow: `0 0 10px ${theme.glow}`,
          transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)' 
        }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))' }}>
        <span>{percentageSold}% vendidos</span>
        {theme.alert && (
          <span className="pulse-glow" style={{ color: theme.color, fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <AlertCircle size={12} /> Corra! O estoque está acabando.
          </span>
        )}
      </div>
    </div>
  );
}