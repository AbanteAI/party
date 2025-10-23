import { useState, useEffect } from 'react';

interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

export default function StockTicker() {
  const [stocks, setStocks] = useState<Stock[]>([
    {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      price: 178.72,
      change: 2.34,
      changePercent: 1.33,
    },
    {
      symbol: 'GOOGL',
      name: 'Alphabet Inc.',
      price: 142.56,
      change: -1.23,
      changePercent: -0.86,
    },
    {
      symbol: 'MSFT',
      name: 'Microsoft Corp.',
      price: 378.91,
      change: 5.67,
      changePercent: 1.52,
    },
    {
      symbol: 'AMZN',
      name: 'Amazon.com Inc.',
      price: 156.78,
      change: 3.45,
      changePercent: 2.25,
    },
    {
      symbol: 'TSLA',
      name: 'Tesla Inc.',
      price: 242.84,
      change: -4.56,
      changePercent: -1.84,
    },
    {
      symbol: 'META',
      name: 'Meta Platforms',
      price: 489.23,
      change: 8.91,
      changePercent: 1.86,
    },
  ]);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Simulate real-time price updates
  useEffect(() => {
    const interval = setInterval(() => {
      setStocks((prevStocks) =>
        prevStocks.map((stock) => {
          const randomChange = (Math.random() - 0.5) * 2;
          const newPrice = stock.price + randomChange;
          const newChange = stock.change + randomChange;
          const newChangePercent = (newChange / (newPrice - newChange)) * 100;

          return {
            ...stock,
            price: parseFloat(newPrice.toFixed(2)),
            change: parseFloat(newChange.toFixed(2)),
            changePercent: parseFloat(newChangePercent.toFixed(2)),
          };
        })
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const filteredStocks = stocks.filter(
    (stock) =>
      stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stock.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        padding: '40px 20px',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Header */}
      <div
        style={{ maxWidth: '1200px', margin: '0 auto', marginBottom: '40px' }}
      >
        <h1
          style={{
            fontSize: '48px',
            fontWeight: 'bold',
            color: 'white',
            textAlign: 'center',
            marginBottom: '10px',
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
          }}
        >
          📈 Stock Ticker
        </h1>
        <p
          style={{
            fontSize: '18px',
            color: 'rgba(255,255,255,0.9)',
            textAlign: 'center',
            marginBottom: '20px',
          }}
        >
          Real-time stock market data (simulated)
        </p>

        {/* Search Bar */}
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <input
            type="text"
            placeholder="Search stocks by symbol or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '15px 20px',
              borderRadius: '15px',
              border: 'none',
              fontSize: '16px',
              background: 'rgba(255,255,255,0.95)',
              boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            }}
          />
        </div>
      </div>

      {/* Stock Cards */}
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '25px',
        }}
      >
        {filteredStocks.map((stock) => (
          <div
            key={stock.symbol}
            onClick={() => setSelectedStock(stock)}
            style={{
              background: 'rgba(255,255,255,0.95)',
              borderRadius: '20px',
              padding: '30px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 15px 40px rgba(0,0,0,0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)';
            }}
          >
            {/* Symbol */}
            <div
              style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: '#1f2937',
                marginBottom: '5px',
              }}
            >
              {stock.symbol}
            </div>

            {/* Name */}
            <div
              style={{
                fontSize: '14px',
                color: '#6b7280',
                marginBottom: '20px',
              }}
            >
              {stock.name}
            </div>

            {/* Price */}
            <div
              style={{
                fontSize: '36px',
                fontWeight: 'bold',
                color: '#1f2937',
                marginBottom: '10px',
              }}
            >
              ${stock.price.toFixed(2)}
            </div>

            {/* Change */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <div
                style={{
                  padding: '8px 16px',
                  borderRadius: '10px',
                  background: stock.change >= 0 ? '#10b981' : '#ef4444',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '14px',
                }}
              >
                {stock.change >= 0 ? '▲' : '▼'} $
                {Math.abs(stock.change).toFixed(2)}
              </div>
              <div
                style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: stock.change >= 0 ? '#10b981' : '#ef4444',
                }}
              >
                {stock.changePercent >= 0 ? '+' : ''}
                {stock.changePercent.toFixed(2)}%
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Stock Modal */}
      {selectedStock && (
        <div
          onClick={() => setSelectedStock(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: '20px',
              padding: '40px',
              maxWidth: '600px',
              width: '100%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}
          >
            <h2
              style={{
                fontSize: '36px',
                fontWeight: 'bold',
                color: '#1f2937',
                marginBottom: '10px',
              }}
            >
              {selectedStock.symbol}
            </h2>
            <p
              style={{
                fontSize: '16px',
                color: '#6b7280',
                marginBottom: '30px',
              }}
            >
              {selectedStock.name}
            </p>

            <div style={{ marginBottom: '20px' }}>
              <div
                style={{
                  fontSize: '48px',
                  fontWeight: 'bold',
                  color: '#1f2937',
                  marginBottom: '10px',
                }}
              >
                ${selectedStock.price.toFixed(2)}
              </div>
              <div
                style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: selectedStock.change >= 0 ? '#10b981' : '#ef4444',
                }}
              >
                {selectedStock.change >= 0 ? '▲' : '▼'} $
                {Math.abs(selectedStock.change).toFixed(2)} (
                {selectedStock.changePercent >= 0 ? '+' : ''}
                {selectedStock.changePercent.toFixed(2)}%)
              </div>
            </div>

            <button
              onClick={() => setSelectedStock(null)}
              style={{
                width: '100%',
                padding: '15px',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '16px',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Back Button */}
      <div
        style={{
          maxWidth: '1200px',
          margin: '40px auto 0',
          textAlign: 'center',
        }}
      >
        <button
          onClick={() => window.history.back()}
          style={{
            padding: '15px 30px',
            borderRadius: '15px',
            border: 'none',
            background: 'rgba(255,255,255,0.2)',
            backdropFilter: 'blur(10px)',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '16px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
          }}
        >
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
}
