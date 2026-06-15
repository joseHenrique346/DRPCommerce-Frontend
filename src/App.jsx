import React, { useState, useEffect } from 'react';
import { Sparkles, ShoppingBag, ShieldCheck, RefreshCw, Layers, ArrowLeft } from 'lucide-react';
import { api, getVirtualTime, subscribeToSimState } from './services/api';
import Countdown from './components/Countdown';
import QueueStatus from './components/QueueStatus';
import StockProgress from './components/StockProgress';
import ProductDetails from './components/ProductDetails';
import CheckoutModal from './components/CheckoutModal';
import SimulationPanel from './components/SimulationPanel';
import EventPortal from './components/EventPortal';

export default function App() {
  const [currentPage, setCurrentPage] = useState('portal');
  const [selectedEventId, setSelectedEventId] = useState(1);
  const [eventsList, setEventsList] = useState([]);
  const [eventData, setEventData] = useState(null);
  const [productData, setProductData] = useState(null);
  const [queueEntry, setQueueEntry] = useState(null);
  const [virtualTime, setVirtualTime] = useState(getVirtualTime());
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [successOrder, setSuccessOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [secondsToExpiry, setSecondsToExpiry] = useState(600);

  const loadPortalData = async () => {
    try {
      const response = await api.getAllDropEvents();
      if (response.isSuccess) {
        setEventsList(response.content);
      }
    } catch (err) {
      console.error("Portal fetch failed", err);
    }
  };

  const loadEventDetailData = async (eventId) => {
    setIsLoading(true);
    setSuccessOrder(null);
    setQueueEntry(null);
    setEventData(null);
    setProductData(null);
    setSecondsToExpiry(600);

    try {
      const eventRes = await api.getDropEvent(eventId);
      if (eventRes.isSuccess) {
        setEventData(eventRes.content);
      }

      const productRes = await api.getDropProduct(eventId);
      if (productRes.isSuccess && productRes.content?.[0]) {
        setProductData(productRes.content[0]);
      }

      const savedQueue = localStorage.getItem(`veloce_queue_entry_${eventId}`);
      if (savedQueue) {
        setQueueEntry(JSON.parse(savedQueue));
      }

      const savedOrder = localStorage.getItem(`veloce_order_success_${eventId}`);
      if (savedOrder) {
        setSuccessOrder(JSON.parse(savedOrder));
      }
    } catch (err) {
      console.error("Failed to load details for event", eventId, err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPortalData();

    const unsubscribeSim = subscribeToSimState((newSim) => {
      setVirtualTime(new Date(Date.now() + newSim.simulatedTimeOffset));
      
      setEventsList(Object.values(newSim.events).map(ev => ({
        id: ev.id,
        name: ev.name,
        slug: ev.slug,
        description: ev.description,
        coverImageUrl: ev.coverImageUrl,
        price: ev.price,
        totalUnitsAvailable: ev.unitsAllocated,
        unitsSold: ev.unitsSold,
        queueOpensAt: ev.dates.queueOpensAt,
        dropStartsAt: ev.dates.dropStartsAt,
        dropEndsAt: ev.dates.dropEndsAt
      })));

      const evSettings = newSim.events[selectedEventId];
      if (evSettings) {
        setEventData(prev => {
          if (!prev) return null;
          return {
            ...prev,
            totalUnitsAvailable: evSettings.unitsAllocated,
            unitsSold: evSettings.unitsSold,
            registrationStartsAt: evSettings.dates.queueOpensAt,
            registrationEndsAt: evSettings.dates.dropStartsAt,
            queueOpensAt: evSettings.dates.queueOpensAt,
            dropStartsAt: evSettings.dates.dropStartsAt,
            dropEndsAt: evSettings.dates.dropEndsAt
          };
        });

        setProductData(prev => {
          if (!prev) return null;
          return {
            ...prev,
            unitsAllocated: evSettings.unitsAllocated,
            unitsSold: evSettings.unitsSold
          };
        });

        setQueueEntry(prev => {
          if (!prev) return null;
          const localSaved = JSON.parse(localStorage.getItem(`veloce_queue_entry_${selectedEventId}`));
          if (!localSaved) return null;
          
          const updated = {
            ...localSaved,
            position: evSettings.currentPosition,
            statusId: evSettings.queueStatusId
          };
          
          localStorage.setItem(`veloce_queue_entry_${selectedEventId}`, JSON.stringify(updated));
          return updated;
        });

        const savedOrder = localStorage.getItem(`veloce_order_success_${selectedEventId}`);
        if (savedOrder) {
          setSuccessOrder(JSON.parse(savedOrder));
        } else {
          setSuccessOrder(null);
        }
      }
    });

    return () => unsubscribeSim();
  }, [selectedEventId]);

  useEffect(() => {
    if (currentPage === 'detail') {
      loadEventDetailData(selectedEventId);
    } else {
      loadPortalData();
    }
  }, [selectedEventId, currentPage]);

  useEffect(() => {
    const clockInterval = setInterval(() => {
      setVirtualTime(getVirtualTime());
    }, 1000);

    return () => clearInterval(clockInterval);
  }, []);

  useEffect(() => {
    if (!queueEntry || queueEntry.statusId !== 2) {
      setSecondsToExpiry(600);
      return;
    }

    const timerId = setInterval(() => {
      setSecondsToExpiry(prev => {
        if (prev <= 1) {
          clearInterval(timerId);
          const expiredEntry = { 
            ...queueEntry, 
            statusId: 3, 
            expiredAt: new Date().toISOString() 
          };
          setQueueEntry(expiredEntry);
          localStorage.setItem(`veloce_queue_entry_${selectedEventId}`, JSON.stringify(expiredEntry));
          api.updateEventSettings(selectedEventId, { queueStatusId: 3 });
          setIsCheckoutOpen(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [queueEntry, selectedEventId]);

  useEffect(() => {
    if (currentPage !== 'detail') return;

    const stockInterval = setInterval(async () => {
      try {
        const res = await api.getDropProduct(selectedEventId);
        if (res.isSuccess && res.content?.[0]) {
          setProductData(prev => ({
            ...prev,
            unitsSold: res.content[0].unitsSold,
            unitsAllocated: res.content[0].unitsAllocated
          }));
        }
      } catch (err) {
        console.error("Stock sync failed", err);
      }
    }, 4000);

    return () => clearInterval(stockInterval);
  }, [selectedEventId, currentPage]);

  const handleSelectEvent = (eventId) => {
    setSelectedEventId(eventId);
    setCurrentPage('detail');
  };

  const handleJoinQueue = async (alreadyUpdatedEntry = null) => {
    if (alreadyUpdatedEntry) {
      setQueueEntry(alreadyUpdatedEntry);
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.joinQueue(selectedEventId);
      if (response.isSuccess) {
        setQueueEntry(response.content);
        api.updateEventSettings(selectedEventId, { 
          currentPosition: response.content.position,
          initialPosition: response.content.position,
          queueStatusId: response.content.statusId
        });
      }
    } catch (err) {
      console.error("Join queue failed", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckoutSubmit = async (payload) => {
    setIsSubmittingOrder(true);
    try {
      const response = await api.createDropOrder(payload);
      if (response.isSuccess) {
        setSuccessOrder(response.content);
        setIsCheckoutOpen(false);
        setQueueEntry(null);
        return { isSuccess: true };
      }
      return { isSuccess: false, listMessageErrors: response.listMessageErrors };
    } catch (err) {
      console.error("Order submission failed", err);
      return { isSuccess: false, listMessageErrors: ["Erro ao conectar com o serviço de pagamento."] };
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  return (
    <div className="container">
      <header className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {currentPage === 'detail' && (
            <button 
              onClick={() => setCurrentPage('portal')}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-glass)',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              title="Voltar ao Portal"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div className="logo-area" style={{ cursor: 'pointer' }} onClick={() => setCurrentPage('portal')}>
            <Layers size={24} style={{ color: 'hsl(var(--color-secondary))' }} />
            <span>VELOCE // LABS</span>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span className="badge" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)', color: 'hsl(var(--color-text-muted))' }}>
            Servidor: {api.getSettings().isSimulationMode ? "Simulado Local" : "Produção"}
          </span>
          <span style={{ height: '8px', width: '8px', borderRadius: '50%', background: 'hsl(var(--color-secondary))', display: 'inline-block' }} className="pulse-scale" />
        </div>
      </header>

      {currentPage === 'portal' ? (
        <EventPortal 
          events={eventsList} 
          onSelectEvent={handleSelectEvent} 
          virtualTime={virtualTime}
        />
      ) : (
        <main className="main-grid">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <ProductDetails productData={eventData ? { ...eventData, price: productData?.price } : null} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {successOrder ? (
              <div className="glass-card slide-up" style={{ 
                borderLeft: '4px solid hsl(var(--color-success))',
                background: 'radial-gradient(circle at 0% 100%, rgba(76,175,80,0.1), transparent 70%), var(--bg-card-glass)',
                boxShadow: '0 10px 30px rgba(76,175,80,0.15)'
              }}>
                <div style={{ textAlign: 'center', padding: '10px 0 20px' }}>
                  <div style={{ 
                    width: '56px', 
                    height: '56px', 
                    borderRadius: '50%', 
                    background: 'rgba(76, 175, 80, 0.1)', 
                    border: '1px solid rgba(76, 175, 80, 0.3)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    margin: '0 auto 12px',
                    color: 'hsl(var(--color-success))'
                  }}>
                    <ShieldCheck size={32} />
                  </div>
                  <h3 style={{ fontSize: '1.4rem', color: '#fff', marginBottom: '4px' }}>Pedido Confirmado!</h3>
                  <p style={{ fontSize: '0.85rem', color: 'hsl(var(--color-text-muted))' }}>Sua vaga prioritária garantiu a reserva com sucesso.</p>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', fontSize: '0.8rem', border: '1px solid var(--border-glass)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: 'hsl(var(--color-text-muted))' }}>Pedido ID:</span>
                    <span style={{ color: '#fff', fontWeight: 'bold' }}>#{successOrder.id}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: 'hsl(var(--color-text-muted))' }}>Reserva:</span>
                    <span style={{ color: '#fff' }}>LockToken Confirmado</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: 'hsl(var(--color-text-muted))' }}>Envio para:</span>
                    <span style={{ color: '#fff' }}>{successOrder.shippingCity} - {successOrder.shippingState}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-glass)', paddingTop: '8px', marginTop: '8px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                    <span style={{ color: 'hsl(var(--color-text-muted))' }}>Valor Total:</span>
                    <span style={{ color: 'hsl(var(--color-secondary))' }}>R$ {successOrder.totalAmount.toFixed(2).replace('.', ',')}</span>
                  </div>
                </div>

                <div style={{ marginTop: '20px' }}>
                  <button onClick={() => setCurrentPage('portal')} className="btn btn-primary" style={{ background: 'linear-gradient(135deg, hsl(var(--color-primary)), hsl(var(--color-accent)))' }}>Voltar ao Portal</button>
                </div>
              </div>
            ) : (
              <>
                <Countdown eventData={eventData} virtualTime={virtualTime} />

                <QueueStatus 
                  eventData={eventData} 
                  virtualTime={virtualTime}
                  queueEntry={queueEntry}
                  onJoinQueue={handleJoinQueue}
                  onCheckout={() => setIsCheckoutOpen(true)}
                  isLoading={isLoading}
                  secondsToExpiry={secondsToExpiry}
                />

                <StockProgress 
                  unitsAllocated={productData?.unitsAllocated}
                  unitsSold={productData?.unitsSold}
                />
              </>
            )}
          </div>
        </main>
      )}

      {productData && (
        <CheckoutModal 
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          onSubmit={handleCheckoutSubmit}
          productData={{ ...productData, dropEventId: selectedEventId }}
          isLoading={isSubmittingOrder}
          secondsToExpiry={secondsToExpiry}
        />
      )}

      <SimulationPanel activeEventId={selectedEventId} currentPage={currentPage} />
    </div>
  );
}