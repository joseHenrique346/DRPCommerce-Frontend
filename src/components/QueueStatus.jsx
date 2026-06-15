import React, { useEffect, useState } from 'react';
import { Users, Hourglass, CheckCircle, Flame, ArrowRight, ShieldAlert } from 'lucide-react';
import { api } from '../services/api';

export default function QueueStatus({ eventData, virtualTime, queueEntry, onJoinQueue, onCheckout, isLoading, secondsToExpiry }) {
  const [localQueue, setLocalQueue] = useState(queueEntry);

  useEffect(() => {
    setLocalQueue(queueEntry);
  }, [queueEntry]);

  useEffect(() => {
    if (!localQueue || localQueue.statusId !== 1) return;

    const intervalId = setInterval(async () => {
      try {
        const response = await api.getQueueStatus(localQueue.id, localQueue.dropEventId);
        if (response.isSuccess) {
          setLocalQueue(response.content);
          
          if (response.content.statusId !== 1) {
            onJoinQueue(response.content); 
          }
        }
      } catch (err) {
        console.error("Queue check failed", err);
      }
    }, 3000); 

    return () => clearInterval(intervalId);
  }, [localQueue, onJoinQueue]);

  if (!eventData) return null;

  const now = virtualTime ? new Date(virtualTime) : new Date();
  const queueOpens = new Date(eventData.queueOpensAt);
  const dropEnds = new Date(eventData.dropEndsAt);

  const isQueueAvailable = now >= queueOpens && now < dropEnds;
  const isDropEnded = now >= dropEnds;

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${String(remainingSecs).padStart(2, '0')}`;
  };

  const getEstTime = (pos) => {
    if (pos <= 0) return "Menos de 1 minuto";
    const minutes = Math.ceil(pos * 0.15); 
    if (minutes < 1) return "Menos de a minuto";
    return `Aprox. ${minutes} min`;
  };

  if (isDropEnded) {
    return (
      <div className="glass-card slide-up" style={{ animationDelay: '0.2s', borderLeft: '4px solid rgba(255,255,255,0.2)' }}>
        <h3 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldAlert size={18} style={{ color: 'hsl(var(--color-text-muted))' }} />
          Fila Encerrada
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'hsl(var(--color-text-muted))' }}>
          O evento de drop encerrou. A fila de espera não aceita mais cadastros.
        </p>
      </div>
    );
  }

  if (!isQueueAvailable) {
    return (
      <div className="glass-card slide-up" style={{ animationDelay: '0.2s', borderLeft: '4px solid hsla(var(--color-warning), 0.5)' }}>
        <h3 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Hourglass size={18} style={{ color: 'hsl(var(--color-warning))' }} />
          Fila Fechada
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'hsl(var(--color-text-muted))', marginBottom: '16px' }}>
          A sala de espera abrirá quando o cronômetro alcançar a abertura da fila. Fique atento.
        </p>
        <button className="btn btn-secondary" disabled>
          Entrar na Fila (Bloqueado)
        </button>
      </div>
    );
  }

  if (!localQueue) {
    return (
      <div className="glass-card slide-up" style={{ animationDelay: '0.2s', borderLeft: '4px solid hsla(var(--color-secondary), 0.5)' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
          <Users size={20} style={{ color: 'hsl(var(--color-secondary))' }} />
          <h3 style={{ color: '#fff', fontSize: '1.15rem' }}>Sala de Espera Ativa</h3>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'hsl(var(--color-text-muted))', marginBottom: '20px' }}>
          O fluxo do evento garante compras em ordem de chegada. Registre sua vaga na fila agora mesmo para garantir prioridade de checkout.
        </p>
        <button 
          onClick={() => onJoinQueue()} 
          disabled={isLoading}
          className="btn btn-primary pulse-scale"
          style={{ boxShadow: 'var(--shadow-neon-cyan)', background: 'linear-gradient(135deg, hsl(var(--color-secondary)), hsl(var(--color-primary)))' }}
        >
          {isLoading ? (
            <div className="spinner" style={{ width: '18px', height: '18px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          ) : (
            <>
              Entrar na Fila de Espera
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </div>
    );
  }

  if (localQueue.statusId === 1) {
    const progressPercent = Math.max(2, 100 - (localQueue.position / 150) * 100);

    return (
      <div className="glass-card slide-up" style={{ 
        animationDelay: '0.2s', 
        borderLeft: '4px solid hsla(var(--color-warning), 0.8)',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <h3 style={{ color: '#fff', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
              <Hourglass size={18} className="pulse-scale" style={{ color: 'hsl(var(--color-warning))' }} />
              Aguardando sua Vez
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'hsl(var(--color-text-muted))' }}>Você está na fila de espera prioritária</p>
          </div>
          <span className="badge badge-waiting pulse-glow">Em Fila</span>
        </div>

        <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'hsl(var(--color-text-muted))' }}>Sua Posição</div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', fontFamily: 'var(--font-heading)', color: 'hsl(var(--color-warning))' }}>
              #{localQueue.position}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'hsl(var(--color-text-muted))' }}>Espera Estimada</div>
            <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff', marginTop: '6px' }}>
              {getEstTime(localQueue.position)}
            </div>
          </div>
        </div>

        <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden', marginBottom: '8px' }}>
          <div style={{ 
            height: '100%', 
            width: `${progressPercent}%`, 
            background: 'hsl(var(--color-warning))', 
            transition: 'width 1s ease-in-out',
            boxShadow: '0 0 8px hsl(var(--color-warning))' 
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))' }}>
          <span>Verificando liberação...</span>
          <span>Atualizado a cada 3s</span>
        </div>
      </div>
    );
  }

  if (localQueue.statusId === 2) {
    return (
      <div className="glass-card slide-up" style={{ 
        animationDelay: '0.2s', 
        borderLeft: '4px solid hsl(var(--color-success))',
        background: 'radial-gradient(circle at 100% 0%, rgba(76,175,80,0.1), transparent 60%), var(--bg-card-glass)',
        boxShadow: '0 0 25px rgba(76,175,80,0.15)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <h3 style={{ color: 'hsl(var(--color-success))', fontSize: '1.25rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
              <CheckCircle size={20} />
              Acesso Liberado!
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'hsl(var(--color-text-muted))' }}>Sua vaga na fila de compra está ativa</p>
          </div>
          <span className="badge badge-success pulse-scale">Liberado</span>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'hsl(var(--color-text-main))', marginBottom: '16px' }}>
          Seu token de reserva foi gerado com sucesso. Finalize sua compra antes que o cronômetro expire e você perca seu lugar.
        </p>

        <div style={{ 
          background: 'rgba(76, 175, 80, 0.05)', 
          border: '1px solid rgba(76, 175, 80, 0.2)', 
          borderRadius: '12px', 
          padding: '12px', 
          textAlign: 'center', 
          marginBottom: '20px' 
        }}>
          <div style={{ fontSize: '0.7rem', color: 'hsl(var(--color-text-muted))', textTransform: 'uppercase' }}>O carrinho expira em:</div>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'hsl(var(--color-success))', fontFamily: 'var(--font-heading)' }}>
            {formatTime(secondsToExpiry)}
          </div>
        </div>

        <button 
          onClick={onCheckout} 
          className="btn btn-primary pulse-glow"
          style={{ background: 'linear-gradient(135deg, hsl(var(--color-success)), #81C784)', boxShadow: '0 0 15px rgba(76,175,80,0.4)' }}
        >
          Comprar Agora
          <Flame size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="glass-card slide-up" style={{ animationDelay: '0.2s', borderLeft: '4px solid var(--border-glass)' }}>
      <h3 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <CheckCircle size={18} style={{ color: 'hsl(var(--color-text-muted))' }} />
        Sessão Concluída
      </h3>
      <p style={{ fontSize: '0.85rem', color: 'hsl(var(--color-text-muted))' }}>
        Seu fluxo de compra nesta fila foi finalizado ou expirou.
      </p>
    </div>
  );
}