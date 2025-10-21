import { useState, useEffect } from 'react';

interface AppCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  link?: string;
  comingSoon?: boolean;
}

export default function Dashboard() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const apps: AppCard[] = [
    {
      id: 'snake',
      title: 'Snake Game',
      description: 'Classic snake with AI enemies',
      icon: '🐍',
      color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      link: '/snake',
      comingSoon: true,
    },
    {
      id: 'chat',
      title: 'AI Chat',
      description: 'Chat with AI powered by Pollinations',
      icon: '🤖',
      color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      comingSoon: true,
    },
    {
      id: 'world',
      title: 'World Conquest',
      description: 'Strategy game - conquer the world',
      icon: '🌍',
      color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      comingSoon: true,
    },
    {
      id: 'stock',
      title: 'Stock Ticker',
      description: 'Real-time stock market data',
      icon: '📈',
      color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      comingSoon: true,
    },
    {
      id: 'polls',
      title: 'Polls',
      description: 'Create and vote on polls',
      icon: '📊',
      color: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      comingSoon: true,
    },
    {
      id: 'games',
      title: 'More Games',
      description: 'Additional games coming soon',
      icon: '🎮',
      color: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
      comingSoon: true,
    },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
          🎉 Mentat Party Dashboard
        </h1>
        <p
          style={{
            fontSize: '18px',
            color: 'rgba(255,255,255,0.9)',
            textAlign: 'center',
            marginBottom: '20px',
          }}
        >
          Your hub for games, tools, and AI-powered features
        </p>
        <div
          style={{
            fontSize: '24px',
            color: 'white',
            textAlign: 'center',
            fontWeight: '300',
          }}
        >
          {time.toLocaleTimeString()}
        </div>
      </div>

      {/* Stats Bar */}
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto 40px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
        }}
      >
        {[
          { label: 'Total Apps', value: apps.length, icon: '📱' },
          { label: 'Active Users', value: '1', icon: '👥' },
          { label: 'Games', value: '3', icon: '🎮' },
          { label: 'Status', value: 'Online', icon: '✅' },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              background: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(10px)',
              borderRadius: '15px',
              padding: '20px',
              textAlign: 'center',
              border: '1px solid rgba(255,255,255,0.3)',
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>
              {stat.icon}
            </div>
            <div
              style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: 'white',
                marginBottom: '5px',
              }}
            >
              {stat.value}
            </div>
            <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* App Cards */}
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '25px',
        }}
      >
        {apps.map((app) => (
          <div
            key={app.id}
            style={{
              background: 'rgba(255,255,255,0.95)',
              borderRadius: '20px',
              padding: '30px',
              cursor: app.comingSoon ? 'default' : 'pointer',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            }}
            onMouseEnter={(e) => {
              if (!app.comingSoon) {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 15px 40px rgba(0,0,0,0.3)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)';
            }}
          >
            {/* Gradient Background */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '100px',
                background: app.color,
                opacity: 0.1,
              }}
            />

            {/* Icon */}
            <div
              style={{
                fontSize: '64px',
                marginBottom: '20px',
                textAlign: 'center',
              }}
            >
              {app.icon}
            </div>

            {/* Title */}
            <h3
              style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#1f2937',
                marginBottom: '10px',
                textAlign: 'center',
              }}
            >
              {app.title}
            </h3>

            {/* Description */}
            <p
              style={{
                fontSize: '14px',
                color: '#6b7280',
                textAlign: 'center',
                marginBottom: '20px',
                minHeight: '40px',
              }}
            >
              {app.description}
            </p>

            {/* Button */}
            {app.comingSoon ? (
              <div
                style={{
                  padding: '12px 24px',
                  background:
                    'linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%)',
                  borderRadius: '10px',
                  textAlign: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '14px',
                }}
              >
                Coming Soon
              </div>
            ) : (
              <button
                style={{
                  width: '100%',
                  padding: '12px 24px',
                  background: app.color,
                  border: 'none',
                  borderRadius: '10px',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'opacity 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                Launch App
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div
        style={{
          maxWidth: '1200px',
          margin: '60px auto 0',
          textAlign: 'center',
          color: 'rgba(255,255,255,0.8)',
          fontSize: '14px',
        }}
      >
        <p>Built with ❤️ by Mentat AI</p>
        <p style={{ marginTop: '10px' }}>
          More features coming soon! Tag @MentatBot on GitHub to request
          features.
        </p>
      </div>
    </div>
  );
}
