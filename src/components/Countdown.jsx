import React, { useState, useEffect } from 'react';
import { Clock, Zap, AlertTriangle } from 'lucide-react';

export default function Countdown({ eventData, virtualTime }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [phase, setPhase] = useState('upcoming'); 

  useEffect(() => {
    if (!eventData) return;

    const calculateTime = () => {
      const now = virtualTime ? new Date(virtualTime) : new Date();
      const queueOpens = new Date(eventData.queueOpensAt);
      const dropStarts = new Date(eventData.dropStartsAt);
      const dropEnds = new Date(eventData.dropEndsAt);

      let targetDate = null;
      let currentPhase = 'upcoming';

      if (now < queueOpens) {
        targetDate = queueOpens;
        currentPhase = 'upcoming'; 
      } else if (now < dropStarts) {
        targetDate = dropStarts;
        currentPhase = 'queueOpen'; 
      } else if (now < dropEnds) {
        targetDate = dropEnds;
        currentPhase = 'active'; 
      } else {
        currentPhase = 'ended'; 
      }

      setPhase(currentPhase);

      if (currentPhase === 'ended') {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      if (currentPhase === 'active') {
        
        const diff = dropEnds - now;
        setTimeLeft(formatDiff(diff));
        return;
      }

      const diff = targetDate - now;
      setTimeLeft(formatDiff(diff));
    };

    calculateTime();
  }, [eventData, virtualTime]);

  const formatDiff = (diffMs) => {
    if (diffMs <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds };
  };

  const padZero = (num) => String(num).padStart(2, '0');

  const getPhaseHeader = () => {
    switch (phase) {
      case 'upcoming':
        return {
          title: "Abertura da Fila",
          subtitle: "Cadastre-se na sala de espera antes da liberação",
          badge: <span className="badge badge-waiting">Fila em Breve</span>
        };
      case 'queueOpen':
        return {
          title: "Sala de Espera Aberta",
          subtitle: "Garanta seu lugar! O Drop inicia em breve",
          badge: <span className="badge badge-waiting pulse-glow">Fila Disponível</span>
        };
      case 'active':
        return {
          title: "DROP LIVE!",
          subtitle: "Vendas liberadas por ordem de chamada da fila",
          badge: <span className="badge badge-live pulse-scale">AO VIVO</span>
        };
      case 'ended':
      default:
        return {
          title: "Evento Finalizado",
          subtitle: "Obrigado a todos os participantes",
          badge: <span className="badge badge-ended">Encerrado</span>
        };
    }
  };

  const info = getPhaseHeader();

  return (
    <div className="glass-card slide-up" style={{ animationDelay: '0.1s' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', color: '#fff', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={18} style={{ color: phase === 'active' ? 'hsl(var(--color-secondary))' : 'hsl(var(--color-warning))' }} />
            {info.title}
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'hsl(var(--color-text-muted))' }}>{info.subtitle}</p>
        </div>
        {info.badge}
      </div>

      {phase !== 'ended' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', textAlign: 'center' }}>
          {[
            { label: 'dias', value: padZero(timeLeft.days) },
            { label: 'horas', value: padZero(timeLeft.hours) },
            { label: 'minutos', value: padZero(timeLeft.minutes) },
            { label: 'segundos', value: padZero(timeLeft.seconds) },
          ].map((item, idx) => (
            <div key={idx} style={{ 
              background: 'rgba(255, 255, 255, 0.02)', 
              border: '1px solid rgba(255, 255, 255, 0.04)',
              borderRadius: '12px',
              padding: '12px 6px'
            }}>
              <div style={{ 
                fontFamily: 'var(--font-heading)', 
                fontSize: '1.8rem', 
                fontWeight: '800', 
                color: phase === 'active' ? 'hsl(var(--color-secondary))' : '#fff',
                textShadow: phase === 'active' ? '0 0 10px hsla(185, 100%, 50%, 0.3)' : 'none',
                lineHeight: '1.2'
              }}>
                {item.value}
              </div>
              <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'hsl(var(--color-text-muted))', marginTop: '4px' }}>
                {item.label}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.01)', 
          border: '1px solid rgba(255, 255, 255, 0.03)',
          borderRadius: '12px',
          padding: '24px',
          textAlign: 'center',
          color: 'hsl(var(--color-text-muted))'
        }}>
          <AlertTriangle size={36} style={{ margin: '0 auto 12px', color: 'hsl(var(--color-danger))' }} />
          <h4 style={{ color: '#fff', marginBottom: '4px' }}>Inscrições e Vendas Fechadas</h4>
          <p style={{ fontSize: '0.85rem' }}>Este drop encerrou seu período de vigência.</p>
        </div>
      )}
    </div>
  );
}