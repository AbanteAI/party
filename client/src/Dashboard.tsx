import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface AppCard {
  id: string;
  name: string;
  description: string;
  icon: string;
  path: string;
  color: string;
}

const apps: AppCard[] = [
  {
    id: 'snake',
    name: 'Snake Game',
    description: '100+ features, particles, trails, achievements!',
    icon: '🐍',
    path: '/snake',
    color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  {
    id: 'stock',
    name: 'Stock Ticker',
    description: 'Real-time stock data and charts',
    icon: '📈',
    path: '/stock',
    color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  },
  {
    id: 'polls',
    name: 'Polls',
    description: 'Create and vote on polls',
    icon: '📊',
    path: '/polls',
    color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  },
];

function Dashboard() {
  const [linesOfCode] = useState(3991); // Total LOC in repo
  const [messages, setMessages] = useState<any[]>([]);
  const [username, setUsername] = useState('');
  const [messageText, setMessageText] = useState('');

  // Load username from localStorage
  useEffect(() => {
    const savedUsername = localStorage.getItem('chatUsername');
    if (savedUsername) {
      setUsername(savedUsername);
    }
  }, []);

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch('/api/messages');
        if (response.ok) {
          const data = await response.json();
          setMessages(data);
        }
      } catch (err) {
        console.error('Error fetching messages:', err);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 2000);
    return () => clearInterval(interval);
  }, []);

  const sendMessage = async () => {
    if (!messageText.trim() || !username.trim()) return;

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, message: messageText }),
      });

      if (response.ok) {
        setMessageText('');
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '40px 20px',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1
            style={{
              fontSize: '48px',
              fontWeight: '700',
              color: 'white',
              marginBottom: '10px',
              textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
            }}
          >
            🎨 Slop Board
          </h1>
          <p
            style={{
              fontSize: '18px',
              color: 'rgba(255,255,255,0.9)',
              marginBottom: '20px',
            }}
          >
            AI-Generated Apps Dashboard
          </p>
        </div>

        {/* Stats Card */}
        <div
          style={{
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '30px',
            marginBottom: '30px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: '48px',
                fontWeight: '700',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '10px',
              }}
            >
              {linesOfCode.toLocaleString()}
            </div>
            <div style={{ fontSize: '18px', color: '#666' }}>
              Lines of Code Generated
            </div>
          </div>
        </div>

        {/* App Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px',
            marginBottom: '40px',
          }}
        >
          {apps.map((app) => (
            <Link
              key={app.id}
              to={app.path}
              style={{
                textDecoration: 'none',
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(10px)',
                borderRadius: '20px',
                padding: '30px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 15px 50px rgba(0,0,0,0.3)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 40px rgba(0,0,0,0.2)';
              }}
            >
              <div
                style={{
                  fontSize: '64px',
                  marginBottom: '15px',
                  textAlign: 'center',
                }}
              >
                {app.icon}
              </div>
              <h3
                style={{
                  fontSize: '24px',
                  fontWeight: '600',
                  color: '#333',
                  marginBottom: '10px',
                  textAlign: 'center',
                }}
              >
                {app.name}
              </h3>
              <p
                style={{
                  fontSize: '14px',
                  color: '#666',
                  textAlign: 'center',
                  lineHeight: '1.5',
                }}
              >
                {app.description}
              </p>
            </Link>
          ))}
        </div>

        {/* Chat Section */}
        <div
          style={{
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '30px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          }}
        >
          <h2
            style={{
              fontSize: '24px',
              fontWeight: '600',
              color: '#333',
              marginBottom: '20px',
            }}
          >
            💬 Chat
          </h2>

          {/* Username Input */}
          {!username && (
            <div style={{ marginBottom: '20px' }}>
              <input
                type="text"
                placeholder="Enter your name..."
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  localStorage.setItem('chatUsername', e.target.value);
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
              />
            </div>
          )}

          {/* Messages */}
          <div
            style={{
              maxHeight: '300px',
              overflowY: 'auto',
              marginBottom: '20px',
              padding: '10px',
              background: '#f8fafc',
              borderRadius: '8px',
            }}
          >
            {messages.length === 0 ? (
              <div
                style={{ textAlign: 'center', color: '#999', padding: '20px' }}
              >
                No messages yet. Be the first to chat!
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    marginBottom: '15px',
                    padding: '10px',
                    background: 'white',
                    borderRadius: '8px',
                  }}
                >
                  <div
                    style={{
                      fontWeight: '600',
                      color: '#667eea',
                      marginBottom: '5px',
                    }}
                  >
                    {msg.username}
                  </div>
                  <div style={{ color: '#333' }}>{msg.message}</div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#999',
                      marginTop: '5px',
                    }}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Message Input */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              placeholder="Type a message..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              disabled={!username}
              style={{
                flex: 1,
                padding: '12px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
              }}
            />
            <button
              onClick={sendMessage}
              disabled={!username || !messageText.trim()}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor:
                  username && messageText.trim() ? 'pointer' : 'not-allowed',
                opacity: username && messageText.trim() ? 1 : 0.5,
              }}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
