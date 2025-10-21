import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  id: string;
}

type Theme = 'light' | 'dark' | 'purple' | 'ocean' | 'forest';

const AVAILABLE_MODELS = ['openai', 'mistral', 'claude', 'llama'];

const THEMES = {
  light: {
    bg: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    headerBg: 'rgba(255, 255, 255, 0.9)',
    headerText: '#1f2937',
    messageBg: 'rgba(255, 255, 255, 0.95)',
    userBg: '#667eea',
    assistantBg: '#f3f4f6',
    text: '#1f2937',
    userText: 'white',
    border: 'rgba(0, 0, 0, 0.1)',
  },
  dark: {
    bg: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    headerBg: 'rgba(0, 0, 0, 0.5)',
    headerText: 'white',
    messageBg: 'rgba(0, 0, 0, 0.3)',
    userBg: '#667eea',
    assistantBg: 'rgba(255, 255, 255, 0.05)',
    text: 'white',
    userText: 'white',
    border: 'rgba(255, 255, 255, 0.1)',
  },
  purple: {
    bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    headerBg: 'rgba(0, 0, 0, 0.2)',
    headerText: 'white',
    messageBg: 'rgba(0, 0, 0, 0.3)',
    userBg: '#ffffff',
    assistantBg: 'rgba(0, 0, 0, 0.3)',
    text: 'white',
    userText: '#1f2937',
    border: 'rgba(255, 255, 255, 0.2)',
  },
  ocean: {
    bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    headerBg: 'rgba(0, 0, 0, 0.2)',
    headerText: 'white',
    messageBg: 'rgba(0, 0, 0, 0.2)',
    userBg: 'rgba(255, 255, 255, 0.9)',
    assistantBg: 'rgba(0, 0, 0, 0.3)',
    text: 'white',
    userText: '#1f2937',
    border: 'rgba(255, 255, 255, 0.1)',
  },
  forest: {
    bg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    headerBg: 'rgba(0, 0, 0, 0.2)',
    headerText: 'white',
    messageBg: 'rgba(0, 0, 0, 0.2)',
    userBg: 'rgba(255, 255, 255, 0.9)',
    assistantBg: 'rgba(0, 0, 0, 0.3)',
    text: 'white',
    userText: '#1f2937',
    border: 'rgba(255, 255, 255, 0.1)',
  },
};

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('openai');
  const [theme, setTheme] = useState<Theme>('purple');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load saved conversations
  useEffect(() => {
    const saved = localStorage.getItem('chat-messages');
    const savedTheme = localStorage.getItem('chat-theme');
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load messages:', e);
      }
    }
    if (savedTheme) {
      setTheme(savedTheme as Theme);
    }
  }, []);

  // Save conversations
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('chat-messages', JSON.stringify(messages));
    }
  }, [messages]);

  // Save theme
  useEffect(() => {
    localStorage.setItem('chat-theme', theme);
  }, [theme]);

  const currentTheme = THEMES[theme];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      id: Date.now().toString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(
        'https://text.pollinations.ai/openai/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: selectedModel,
            messages: [...messages, userMessage],
            stream: true,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';

      if (reader) {
        const assistantId = (Date.now() + 1).toString();
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: '', id: assistantId },
        ]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  assistantMessage += content;
                  setMessages((prev) => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = {
                      role: 'assistant',
                      content: assistantMessage,
                      id: assistantId,
                    };
                    return newMessages;
                  });
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          id: Date.now().toString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const deleteMessage = (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  const startEdit = (id: string, content: string) => {
    setEditingId(id);
    setEditContent(content);
  };

  const saveEdit = () => {
    if (!editingId) return;
    setMessages((prev) =>
      prev.map((m) => (m.id === editingId ? { ...m, content: editContent } : m))
    );
    setEditingId(null);
    setEditContent('');
  };

  const regenerateResponse = async () => {
    if (messages.length < 2) return;
    const lastUserMessage = [...messages]
      .reverse()
      .find((m) => m.role === 'user');
    if (!lastUserMessage) return;

    // Remove last assistant message
    setMessages((prev) => prev.slice(0, -1));

    // Resend
    setInput(lastUserMessage.content);
    setTimeout(() => sendMessage(), 100);
  };

  const clearChat = () => {
    if (confirm('Clear all messages?')) {
      setMessages([]);
      localStorage.removeItem('chat-messages');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatMessage = (content: string) => {
    // Simple code block detection
    const parts = content.split(/(```[\s\S]*?```|`[^`]+`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const code = part.slice(3, -3);
        return (
          <pre
            key={i}
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              padding: '12px',
              borderRadius: '8px',
              overflow: 'auto',
              margin: '8px 0',
            }}
          >
            <code style={{ fontSize: '13px', fontFamily: 'monospace' }}>
              {code}
            </code>
          </pre>
        );
      } else if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={i}
            style={{
              background: 'rgba(0, 0, 0, 0.2)',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '13px',
              fontFamily: 'monospace',
            }}
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background: currentTheme.bg,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '20px',
          background: currentTheme.headerBg,
          backdropFilter: 'blur(10px)',
          borderBottom: `1px solid ${currentTheme.border}`,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px',
          }}
        >
          <h1
            style={{
              margin: 0,
              color: currentTheme.headerText,
              fontSize: '24px',
              fontWeight: 600,
            }}
          >
            🤖 AI Chat Enhanced
          </h1>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={clearChat}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                background: 'rgba(239, 68, 68, 0.8)',
                color: 'white',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              🗑️ Clear
            </button>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: `1px solid ${currentTheme.border}`,
              background: currentTheme.messageBg,
              color: currentTheme.text,
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            {AVAILABLE_MODELS.map((model) => (
              <option key={model} value={model} style={{ color: 'black' }}>
                {model}
              </option>
            ))}
          </select>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as Theme)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: `1px solid ${currentTheme.border}`,
              background: currentTheme.messageBg,
              color: currentTheme.text,
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            <option value="light" style={{ color: 'black' }}>
              ☀️ Light
            </option>
            <option value="dark" style={{ color: 'black' }}>
              🌙 Dark
            </option>
            <option value="purple" style={{ color: 'black' }}>
              💜 Purple
            </option>
            <option value="ocean" style={{ color: 'black' }}>
              🌊 Ocean
            </option>
            <option value="forest" style={{ color: 'black' }}>
              🌲 Forest
            </option>
          </select>
          <span style={{ fontSize: '12px', color: currentTheme.text }}>
            {messages.length} messages
          </span>
        </div>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {messages.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              color: currentTheme.text,
              marginTop: '40px',
              opacity: 0.7,
            }}
          >
            <h2 style={{ fontSize: '32px', margin: '0 0 16px 0' }}>
              👋 Welcome!
            </h2>
            <p style={{ fontSize: '16px' }}>
              Start a conversation with AI powered by Pollinations
            </p>
            <p style={{ fontSize: '14px', marginTop: '20px' }}>
              ✨ Features: Themes, Code highlighting, Save/Load, Edit, Copy
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: message.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            {editingId === message.id ? (
              <div style={{ width: '70%' }}>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '12px',
                    border: `1px solid ${currentTheme.border}`,
                    background: currentTheme.messageBg,
                    color: currentTheme.text,
                    fontSize: '14px',
                    minHeight: '100px',
                  }}
                />
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <button
                    onClick={saveEdit}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      background: '#10b981',
                      color: 'white',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    ✓ Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      background: '#6b7280',
                      color: 'white',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    ✕ Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div
                  style={{
                    maxWidth: '70%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background:
                      message.role === 'user'
                        ? currentTheme.userBg
                        : currentTheme.assistantBg,
                    color:
                      message.role === 'user'
                        ? currentTheme.userText
                        : currentTheme.text,
                    backdropFilter: 'blur(10px)',
                    wordBreak: 'break-word',
                    border:
                      message.role === 'user'
                        ? '2px solid rgba(102, 126, 234, 0.5)'
                        : 'none',
                    boxShadow:
                      message.role === 'user'
                        ? '0 2px 8px rgba(0, 0, 0, 0.15)'
                        : 'none',
                  }}
                >
                  {formatMessage(message.content)}
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                    marginTop: '4px',
                    opacity: 0.7,
                  }}
                >
                  <button
                    onClick={() => copyMessage(message.content)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: 'none',
                      background: 'transparent',
                      color: currentTheme.text,
                      fontSize: '11px',
                      cursor: 'pointer',
                    }}
                    title="Copy"
                  >
                    📋
                  </button>
                  {message.role === 'user' && (
                    <button
                      onClick={() => startEdit(message.id, message.content)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        border: 'none',
                        background: 'transparent',
                        color: currentTheme.text,
                        fontSize: '11px',
                        cursor: 'pointer',
                      }}
                      title="Edit"
                    >
                      ✏️
                    </button>
                  )}
                  <button
                    onClick={() => deleteMessage(message.id)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: 'none',
                      background: 'transparent',
                      color: currentTheme.text,
                      fontSize: '11px',
                      cursor: 'pointer',
                    }}
                    title="Delete"
                  >
                    🗑️
                  </button>
                  {message.role === 'assistant' &&
                    messages[messages.length - 1].id === message.id && (
                      <button
                        onClick={regenerateResponse}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          border: 'none',
                          background: 'transparent',
                          color: currentTheme.text,
                          fontSize: '11px',
                          cursor: 'pointer',
                        }}
                        title="Regenerate"
                      >
                        🔄
                      </button>
                    )}
                </div>
              </>
            )}
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        style={{
          padding: '20px',
          background: currentTheme.headerBg,
          backdropFilter: 'blur(10px)',
          borderTop: `1px solid ${currentTheme.border}`,
        }}
      >
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
            disabled={isLoading}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: '12px',
              border: `1px solid ${currentTheme.border}`,
              background: currentTheme.messageBg,
              color: currentTheme.text,
              fontSize: '14px',
              resize: 'none',
              minHeight: '50px',
              maxHeight: '150px',
            }}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            style={{
              padding: '12px 24px',
              borderRadius: '12px',
              border: 'none',
              background: isLoading ? 'rgba(102, 126, 234, 0.5)' : '#667eea',
              color: 'white',
              fontSize: '14px',
              fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              minWidth: '80px',
            }}
          >
            {isLoading ? '⏳' : '📤 Send'}
          </button>
        </div>
        <div
          style={{
            marginTop: '8px',
            fontSize: '11px',
            color: currentTheme.text,
            opacity: 0.6,
          }}
        >
          💡 Tip: Use ` for inline code, ``` for code blocks
        </div>
      </div>
    </div>
  );
}
