import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Line } from 'react-chartjs-2';

function Stock() {
  const [symbol, setSymbol] = useState('AAPL');
  const [stockData, setStockData] = useState<{
    labels: string[];
    prices: number[];
    currentPrice: number;
    change: number;
    changePercent: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStockData();
    const interval = setInterval(fetchStockData, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [symbol]);

  const fetchStockData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/stock/${symbol}`);
      if (response.ok) {
        const data = await response.json();
        setStockData(data);
      }
    } catch (err) {
      console.error('Error fetching stock data:', err);
    } finally {
      setLoading(false);
    }
  };

  const chartData = stockData
    ? {
        labels: stockData.labels,
        datasets: [
          {
            label: symbol,
            data: stockData.prices,
            borderColor: stockData.change >= 0 ? '#10b981' : '#ef4444',
            backgroundColor:
              stockData.change >= 0
                ? 'rgba(16, 185, 129, 0.1)'
                : 'rgba(239, 68, 68, 0.1)',
            fill: true,
            tension: 0.4,
          },
        ],
      }
    : null;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        padding: '40px 20px',
      }}
    >
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Back Button */}
        <Link
          to="/"
          style={{
            display: 'inline-block',
            marginBottom: '20px',
            padding: '10px 20px',
            background: 'rgba(255,255,255,0.2)',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            fontWeight: '600',
          }}
        >
          ← Back to Dashboard
        </Link>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1
            style={{
              fontSize: '48px',
              fontWeight: '700',
              color: 'white',
              marginBottom: '10px',
              textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
            }}
          >
            📈 Stock Ticker
          </h1>
        </div>

        {/* Symbol Selector */}
        <div
          style={{
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '20px',
            marginBottom: '20px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          }}
        >
          <div
            style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}
          >
            {['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN'].map((sym) => (
              <button
                key={sym}
                onClick={() => setSymbol(sym)}
                style={{
                  padding: '10px 20px',
                  background:
                    symbol === sym
                      ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
                      : '#f8fafc',
                  color: symbol === sym ? 'white' : '#333',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                {sym}
              </button>
            ))}
          </div>
        </div>

        {/* Stock Data */}
        {loading ? (
          <div
            style={{
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: '20px',
              padding: '40px',
              textAlign: 'center',
              boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
            }}
          >
            Loading...
          </div>
        ) : stockData ? (
          <>
            {/* Price Card */}
            <div
              style={{
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(10px)',
                borderRadius: '20px',
                padding: '30px',
                marginBottom: '20px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                textAlign: 'center',
              }}
            >
              <div
                style={{ fontSize: '48px', fontWeight: '700', color: '#333' }}
              >
                ${stockData.currentPrice.toFixed(2)}
              </div>
              <div
                style={{
                  fontSize: '24px',
                  fontWeight: '600',
                  color: stockData.change >= 0 ? '#10b981' : '#ef4444',
                  marginTop: '10px',
                }}
              >
                {stockData.change >= 0 ? '+' : ''}
                {stockData.change.toFixed(2)} (
                {stockData.changePercent.toFixed(2)}
                %)
              </div>
            </div>

            {/* Chart */}
            <div
              style={{
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(10px)',
                borderRadius: '20px',
                padding: '30px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
              }}
            >
              {chartData && <Line data={chartData} />}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

export default Stock;
