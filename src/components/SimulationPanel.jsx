import React, { useState, useEffect } from 'react';
import { Settings, RefreshCw, Sliders, Play, Terminal, ChevronDown, ChevronUp, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { api, subscribeToApiLogs, subscribeToSimState, getVirtualTime } from '../services/api';

export default function SimulationPanel({ activeEventId = 1, currentPage = 'portal' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState([]);
  const [simState, setSimState] = useState(api.getSettings());
  const [activeTab, setActiveTab] = useState('controls'); 
  const [expandedLogId, setExpandedLogId] = useState(null);
  const [targetEventId, setTargetEventId] = useState(activeEventId);

  useEffect(() => {
    setTargetEventId(activeEventId);
  }, [activeEventId, currentPage]);

  useEffect(() => {
    const unsubscribeLogs = subscribeToApiLogs((newLogs) => {
      setLogs(newLogs);
    });

    const unsubscribeSim = subscribeToSimState((newSim) => {
      setSimState(newSim);
    });

    return () => {
      unsubscribeLogs();
      unsubscribeSim();
    };
  }, []);

  const currentEventSim = simState.events[targetEventId] || {};

  const shiftTime = (minutes) => {
    const msOffset = minutes * 60 * 1000;
    const currentOffset = simState.simulatedTimeOffset;
    api.updateSettings({ simulatedTimeOffset: currentOffset + msOffset });
  };

  const jumpToPhase = (phase) => {
    const now = Date.now();
    const queueTime = new Date(currentEventSim.dates.queueOpensAt).getTime();
    const startTime = new Date(currentEventSim.dates.dropStartsAt).getTime();
    const endTime = new Date(currentEventSim.dates.dropEndsAt).getTime();
    
    let targetOffset = 0;

    switch (phase) {
      case 'pre_queue':
        targetOffset = (queueTime - 30 * 1000) - now;
        break;
      case 'in_waiting':
        targetOffset = (queueTime + 10 * 1000) - now;
        break;
      case 'drop_start':
        targetOffset = (startTime + 10 * 1000) - now;
        break;
      case 'drop_end':
        targetOffset = (endTime + 10 * 1000) - now;
        break;
      default:
        targetOffset = 0;
    }
    
    api.updateSettings({ simulatedTimeOffset: targetOffset });
  };

  const changePosition = (pos) => {
    api.updateEventSettings(targetEventId, { currentPosition: pos });
  };

  const forceRelease = () => {
    api.updateEventSettings(targetEventId, { queueStatusId: 2, currentPosition: 0 });
  };

  const forceExpire = () => {
    api.updateEventSettings(targetEventId, { queueStatusId: 3 });
  };

  const changeSoldStock = (sold) => {
    api.updateEventSettings(targetEventId, { unitsSold: sold });
  };

  const handleReset = () => {
    if (window.confirm("Reiniciar simulação de banco de dados local? Todos os estados de fila e compras serão limpos.")) {
      api.resetSimulation();
      window.location.reload();
    }
  };

  const virtualClockString = () => {
    const vt = getVirtualTime();
    return vt.toLocaleTimeString('pt-BR') + ' ' + vt.toLocaleDateString('pt-BR');
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      fontFamily: 'monospace',
    }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 16px',
          borderRadius: '9999px',
          background: isOpen ? '#1D212A' : 'linear-gradient(135deg, #FF1744, #7C4DFF)',
          color: '#fff',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          cursor: 'pointer',
          fontWeight: 'bold',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <Settings size={16} className={isOpen ? 'spin-anim' : ''} />
        {isOpen ? "Fechar Simulador" : `Abrir Painel de Simulação (${isOpen ? 'Expandido' : 'Dev'})`}
      </button>

      {isOpen && (
        <div style={{
          width: '400px',
          maxHeight: '580px',
          background: '#0D1017',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '16px',
          boxShadow: '0 12px 40px rgba(0,0,0,0.8), 0 0 20px rgba(124, 77, 255, 0.15)',
          marginTop: '12px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: '#E2E8F0',
          animation: 'slideUp 0.3s ease-out forwards',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            background: '#161B22',
          }}>
            <span style={{ fontWeight: 'bold', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', color: '#FF5252' }}>
              <Sliders size={14} /> SIMULADOR // MULTI-EVENTO
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={handleReset}
                title="Reset Database"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                  padding: '2px',
                }}
                onMouseOver={(e) => e.currentTarget.style.color = '#fff'}
                onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
              >
                <RefreshCw size={14} />
              </button>
            </div>
          </div>

          <div style={{
            background: 'rgba(124, 77, 255, 0.08)',
            padding: '8px 16px',
            fontSize: '0.75rem',
            borderBottom: '1px solid rgba(124, 77, 255, 0.15)',
            display: 'flex',
            justifyContent: 'space-between',
          }}>
            <span>🕒 Hora Virtual:</span>
            <span style={{ color: 'hsl(var(--color-secondary))', fontWeight: 'bold' }}>{virtualClockString()}</span>
          </div>

          <div style={{
            background: '#161B22',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            gap: '10px'
          }}>
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>Alvo do Simulador:</span>
            {currentPage === 'detail' ? (
              <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'hsl(var(--color-primary))' }}>
                {currentEventSim.name} (ID: {targetEventId})
              </span>
            ) : (
              <select 
                value={targetEventId} 
                onChange={(e) => setTargetEventId(parseInt(e.target.value))}
                style={{
                  background: '#0D1017',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#fff',
                  borderRadius: '4px',
                  padding: '2px 6px',
                  fontSize: '0.75rem',
                  fontFamily: 'monospace',
                  cursor: 'pointer'
                }}
              >
                <option value={1}>Sneaker (ID: 1)</option>
                <option value={2}>Hoodie (ID: 2)</option>
                <option value={3}>Keyboard (ID: 3)</option>
              </select>
            )}
          </div>

          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <button 
              onClick={() => setActiveTab('controls')}
              style={{
                flex: 1,
                padding: '10px',
                background: activeTab === 'controls' ? 'transparent' : '#161B22',
                border: 'none',
                color: activeTab === 'controls' ? '#fff' : 'rgba(255,255,255,0.6)',
                borderBottom: activeTab === 'controls' ? '2px solid hsl(var(--color-primary))' : 'none',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: 'bold',
              }}
            >
              CONTROLES DE ESTADO
            </button>
            <button 
              onClick={() => setActiveTab('logs')}
              style={{
                flex: 1,
                padding: '10px',
                background: activeTab === 'logs' ? 'transparent' : '#161B22',
                border: 'none',
                color: activeTab === 'logs' ? '#fff' : 'rgba(255,255,255,0.6)',
                borderBottom: activeTab === 'logs' ? '2px solid hsl(var(--color-primary))' : 'none',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <Terminal size={12} />
              REDE ({logs.length})
            </button>
          </div>

          <div style={{ overflowY: 'auto', padding: '16px', flex: 1, fontSize: '0.8rem' }}>
            {activeTab === 'controls' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <h4 style={{ color: '#fff', fontSize: '0.8rem', marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px' }}>
                    1. Linha do Tempo (Do Alvo Escolhido)
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                    <button onClick={() => jumpToPhase('pre_queue')} style={actionBtnStyle}>Fila Indisponível</button>
                    <button onClick={() => jumpToPhase('in_waiting')} style={actionBtnStyle}>Sala de Espera Aberta</button>
                    <button onClick={() => jumpToPhase('drop_start')} style={actionBtnStyle}>Drop Ao Vivo (LIVE)</button>
                    <button onClick={() => jumpToPhase('drop_end')} style={actionBtnStyle}>Drop Encerrado</button>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '6px' }}>
                    <button onClick={() => shiftTime(-5)} style={smallBtnStyle}>-5 min</button>
                    <button onClick={() => shiftTime(-1)} style={smallBtnStyle}>-1 min</button>
                    <button onClick={() => shiftTime(1)} style={smallBtnStyle}>+1 min</button>
                    <button onClick={() => shiftTime(5)} style={smallBtnStyle}>+5 min</button>
                  </div>
                </div>

                <div>
                  <h4 style={{ color: '#fff', fontSize: '0.8rem', marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px' }}>
                    2. Fila de Espera (Do Alvo Escolhido)
                  </h4>
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span>Posição atual na fila:</span>
                      <span style={{ color: 'hsl(var(--color-warning))', fontWeight: 'bold' }}>#{currentEventSim.currentPosition}</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="200" 
                      value={currentEventSim.currentPosition || 0}
                      onChange={(e) => changePosition(parseInt(e.target.value))}
                      style={{ width: '100%', accentColor: 'hsl(var(--color-warning))' }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <button onClick={forceRelease} style={{ ...actionBtnStyle, color: '#4CAF50', borderColor: 'rgba(76,175,80,0.3)' }}>Liberar Checkout</button>
                    <button onClick={forceExpire} style={{ ...actionBtnStyle, color: '#FF5252', borderColor: 'rgba(255,23,68,0.3)' }}>Expirar Sessão</button>
                  </div>
                </div>

                <div>
                  <h4 style={{ color: '#fff', fontSize: '0.8rem', marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px' }}>
                    3. Estoque do Drop (Do Alvo Escolhido)
                  </h4>
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span>Unidades vendidas:</span>
                      <span style={{ color: 'hsl(var(--color-secondary))', fontWeight: 'bold' }}>
                        {currentEventSim.unitsSold} / {currentEventSim.unitsAllocated} ({Math.round(((currentEventSim.unitsSold||0)/(currentEventSim.unitsAllocated||1))*100)}%)
                      </span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max={currentEventSim.unitsAllocated || 100} 
                      value={currentEventSim.unitsSold || 0}
                      onChange={(e) => changeSoldStock(parseInt(e.target.value))}
                      style={{ width: '100%', accentColor: 'hsl(var(--color-secondary))' }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                    <button onClick={() => changeSoldStock(0)} style={smallBtnStyle}>Limpar Vendas</button>
                    <button onClick={() => changeSoldStock((currentEventSim.unitsAllocated || 10) - 5)} style={smallBtnStyle}>Últimas 5 Unidades</button>
                    <button onClick={() => changeSoldStock(currentEventSim.unitsAllocated || 10)} style={{ ...smallBtnStyle, color: '#FF5252' }}>Esgotar Estoque</button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'logs' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {logs.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: '40px 0' }}>
                    Nenhuma requisição de rede interceptada ainda.
                  </div>
                ) : (
                  logs.map((log) => {
                    const isExpanded = expandedLogId === log.id;
                    const methodColor = log.method === 'GET' ? '#00E5FF' : '#FF1744';
                    const statusColor = log.status >= 200 && log.status < 300 ? '#4CAF50' : '#FF5252';

                    return (
                      <div key={log.id} style={{
                        background: '#161B22',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '6px',
                        overflow: 'hidden',
                      }}>
                        <div 
                          onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                          style={{
                            padding: '8px 12px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            cursor: 'pointer',
                            userSelect: 'none',
                          }}
                          onMouseOver={(e) => e.currentTarget.style.background = '#21262d'}
                          onMouseOut={(e) => e.currentTarget.style.background = '#161B22'}
                        >
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span style={{ color: methodColor, fontWeight: 'bold', fontSize: '0.7rem' }}>{log.method}</span>
                            <span style={{ color: '#E2E8F0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                              {log.url}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span style={{ color: statusColor, fontWeight: 'bold' }}>{log.status}</span>
                            {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          </div>
                        </div>

                        {isExpanded && (
                          <div style={{
                            padding: '12px',
                            borderTop: '1px solid rgba(255,255,255,0.05)',
                            background: '#0B0C10',
                            fontSize: '0.7rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                          }}>
                            <div>
                              <div style={{ color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '4px' }}>Request Body:</div>
                              <pre style={{ margin: 0, padding: '6px', background: '#161B22', overflowX: 'auto', borderRadius: '4px', color: '#A0AEC0' }}>
                                {log.request}
                              </pre>
                            </div>
                            <div>
                              <div style={{ color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '4px' }}>Response Content:</div>
                              <pre style={{ margin: 0, padding: '6px', background: '#161B22', overflowX: 'auto', borderRadius: '4px', color: '#A0AEC0' }}>
                                {log.response}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        .spin-anim {
          animation: spin 3s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
}

const actionBtnStyle = {
  background: '#1F242F',
  border: '1px solid rgba(255,255,255,0.08)',
  color: '#fff',
  padding: '6px 8px',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '0.75rem',
  fontWeight: 'bold',
  transition: 'all 0.2s',
  textAlign: 'center',
};

const smallBtnStyle = {
  background: 'none',
  border: '1px solid rgba(255,255,255,0.05)',
  color: 'rgba(255,255,255,0.6)',
  padding: '4px 6px',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '0.75rem',
  flex: 1,
  textAlign: 'center',
  transition: 'all 0.2s',
};