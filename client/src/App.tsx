import { useState, useEffect, useRef, useCallback } from 'react';

interface Message {
  id: number;
  username: string;
  message: string;
  timestamp: string;
  reactions: { [emoji: string]: string[] };
}

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [username, setUsername] = useState('');
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load username from localStorage
  useEffect(() => {
    const savedUsername = localStorage.getItem('chatUsername');
    if (savedUsername) {
      setUsername(savedUsername);
    }
  }, []);

  // Save username to localStorage when it changes
  useEffect(() => {
    if (username) {
      localStorage.setItem('chatUsername', username);
    }
  }, [username]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = useCallback(async () => {
    try {
      const response = await fetch('/api/messages');
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 2000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !messageText.trim()) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          message: messageText.trim(),
        }),
      });

      if (response.ok) {
        setMessageText('');
        await fetchMessages();
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setLoading(false);
    }
  };

  const addReaction = async (messageId: number, emoji: string) => {
    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      alert('Please enter a username first!');
      return;
    }

    try {
      const response = await fetch(`/api/messages/${messageId}/react`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emoji,
          username: trimmedUsername,
        }),
      });

      if (response.ok) {
        await fetchMessages();
      }
    } catch (err) {
      console.error('Error adding reaction:', err);
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#fafafa',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        height: '100vh',
        width: '100vw',
        padding: '20px',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div
        className="paper"
        style={{
          maxWidth: '600px',
          width: '100%',
          height: '80vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <h1 style={{ marginBottom: '20px' }}>mentat party 🥳</h1>

        {/* Messages area */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            marginBottom: '20px',
            padding: '10px',
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
          }}
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                marginBottom: '12px',
                padding: '8px',
                backgroundColor: 'white',
                borderRadius: '6px',
              }}
            >
              <div
                style={{
                  fontWeight: '600',
                  fontSize: '14px',
                  color: '#1f2937',
                  marginBottom: '4px',
                }}
              >
                {msg.username}
              </div>
              <div style={{ fontSize: '14px', color: '#374151' }}>
                {msg.message}
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginTop: '8px',
                  flexWrap: 'wrap',
                }}
              >
                {/* Existing reactions */}
                {msg.reactions &&
                  Object.entries(msg.reactions).map(([emoji, users]) => (
                    <button
                      key={emoji}
                      onClick={() => addReaction(msg.id, emoji)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        border: '1px solid #e5e7eb',
                        backgroundColor: users.includes(username.trim())
                          ? '#dbeafe'
                          : '#f9fafb',
                        fontSize: '14px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                      title={users.join(', ')}
                    >
                      <span>{emoji}</span>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>
                        {users.length}
                      </span>
                    </button>
                  ))}
                {/* Quick reaction buttons */}
                {['👍', '❤️', '😂', '🎉']
                  .filter(
                    (emoji) =>
                      !msg.reactions ||
                      !msg.reactions[emoji] ||
                      msg.reactions[emoji].length === 0
                  )
                  .map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => addReaction(msg.id, emoji)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        border: '1px solid #e5e7eb',
                        backgroundColor: '#f9fafb',
                        fontSize: '14px',
                        cursor: 'pointer',
                      }}
                      title={`React with ${emoji}`}
                    >
                      {emoji}
                    </button>
                  ))}
              </div>
              <div
                style={{
                  fontSize: '11px',
                  color: '#9ca3af',
                  marginTop: '4px',
                }}
              >
                {new Date(msg.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input form */}
        <form onSubmit={sendMessage} style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{
              padding: '10px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              fontSize: '14px',
              width: '150px',
            }}
          />
          <input
            type="text"
            placeholder="Type a message..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              fontSize: '14px',
            }}
          />
          <button
            type="submit"
            disabled={loading || !username.trim() || !messageText.trim()}
            style={{
              padding: '10px 20px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: '#3b82f6',
              color: 'white',
              fontSize: '14px',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity:
                loading || !username.trim() || !messageText.trim() ? 0.5 : 1,
            }}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;
