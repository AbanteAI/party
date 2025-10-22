import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  id: string;
  images?: string[]; // Base64 encoded images
}

interface Model {
  name: string;
  description: string;
  tier: 'anonymous' | 'seed';
  vision?: boolean;
  audio?: boolean;
  tools?: boolean;
  reasoning?: boolean;
  maxInputChars?: number;
  aliases?: string[];
}

interface CustomSettings {
  systemPrompt: string;
  temperature: number;
  reasoningEffort: 'low' | 'medium' | 'high';
}

type Theme = 'light' | 'dark' | 'purple' | 'ocean' | 'forest';

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
  const [apiKey, setApiKey] = useState('');
  const [models, setModels] = useState<Model[]>([]);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [customSettings, setCustomSettings] = useState<CustomSettings>({
    systemPrompt: '',
    temperature: 0.7,
    reasoningEffort: 'medium',
  });
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load saved data
  useEffect(() => {
    const saved = localStorage.getItem('chat-messages');
    const savedTheme = localStorage.getItem('chat-theme');
    const savedApiKey = localStorage.getItem('chat-api-key');
    const savedSettings = localStorage.getItem('chat-custom-settings');

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
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
    if (savedSettings) {
      try {
        setCustomSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error('Failed to load settings:', e);
      }
    }
  }, []);

  // Fetch models from API
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch('https://text.pollinations.ai/models');
        if (response.ok) {
          const data = await response.json();
          setModels(data);
        }
      } catch (error) {
        console.error('Failed to fetch models:', error);
        // Fallback to basic models if fetch fails
        setModels([
          { name: 'openai', description: 'OpenAI GPT', tier: 'anonymous' },
          { name: 'mistral', description: 'Mistral', tier: 'anonymous' },
        ]);
      }
    };
    fetchModels();
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

  // Save API key
  useEffect(() => {
    if (apiKey) {
      localStorage.setItem('chat-api-key', apiKey);
    } else {
      localStorage.removeItem('chat-api-key');
    }
  }, [apiKey]);

  // Save custom settings
  useEffect(() => {
    localStorage.setItem(
      'chat-custom-settings',
      JSON.stringify(customSettings)
    );
  }, [customSettings]);

  const currentTheme = THEMES[theme];

  // Filter models based on API key
  const availableModels = models.filter((model) => {
    if (model.tier === 'anonymous') return true;
    return apiKey.length > 0; // Only show seed-tier models if user has API key
  });

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
      images: uploadedImages.length > 0 ? [...uploadedImages] : undefined,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setUploadedImages([]); // Clear uploaded images after sending
    setIsLoading(true);

    let assistantMessage = '';

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      // Format messages for API (handle images for vision models)
      const formattedMessages = [...messages, userMessage].map((msg) => {
        if (msg.images && msg.images.length > 0) {
          return {
            role: msg.role,
            content: [
              { type: 'text', text: msg.content },
              ...msg.images.map((img) => ({
                type: 'image_url',
                image_url: { url: img },
              })),
            ],
          };
        }
        return { role: msg.role, content: msg.content };
      });

      // Add system prompt if set
      const messagesWithSystem = customSettings.systemPrompt
        ? [
            { role: 'system', content: customSettings.systemPrompt },
            ...formattedMessages,
          ]
        : formattedMessages;

      const currentModel = models.find((m) => m.name === selectedModel);
      const requestBody: {
        model: string;
        messages: unknown[];
        stream: boolean;
        seed: number;
        temperature: number;
        reasoning_effort?: string;
      } = {
        model: selectedModel,
        messages: messagesWithSystem,
        stream: true,
        seed: Math.floor(Math.random() * 1000000), // Cache busting
        temperature: customSettings.temperature,
      };

      // Add reasoning effort for reasoning models
      if (currentModel?.reasoning) {
        requestBody.reasoning_effort = customSettings.reasoningEffort;
      }

      const response = await fetch(
        'https://text.pollinations.ai/openai/chat/completions',
        {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

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
      // Generate follow-up questions after assistant responds
      if (assistantMessage) {
        generateFollowUpQuestions(assistantMessage);
      }
    }
  };

  const generateFollowUpQuestions = async (lastResponse: string) => {
    setIsGeneratingQuestions(true);
    setFollowUpQuestions([]);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const response = await fetch(
        'https://text.pollinations.ai/openai/chat/completions',
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model: 'mistral', // Use Mistral for follow-up questions
            messages: [
              {
                role: 'system',
                content:
                  'Generate 3-5 relevant follow-up questions based on the conversation. Return ONLY a JSON array of strings, nothing else. Example: ["Question 1?", "Question 2?", "Question 3?"]',
              },
              {
                role: 'user',
                content: `Based on this response, generate follow-up questions:\n\n${lastResponse}`,
              },
            ],
            stream: false,
            temperature: 0.7,
            seed: Math.floor(Math.random() * 1000000),
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';

        try {
          // Try to parse as JSON array
          const questions = JSON.parse(content);
          if (Array.isArray(questions)) {
            setFollowUpQuestions(questions.slice(0, 5)); // Max 5 questions
          }
        } catch {
          // If not valid JSON, try to extract questions from text
          const lines = content
            .split('\n')
            .filter((line: string) => line.trim().length > 0)
            .slice(0, 5);
          setFollowUpQuestions(lines);
        }
      }
    } catch (error) {
      console.error('Failed to generate follow-up questions:', error);
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const sendFollowUpQuestion = (question: string) => {
    setInput(question);
    setFollowUpQuestions([]);
    // Trigger send after a brief delay to allow input to update
    setTimeout(() => sendMessage(), 100);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64 = event.target?.result as string;
          setUploadedImages((prev) => [...prev, base64]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
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
    const messagesWithoutLast = messages.slice(0, -1);
    setMessages(messagesWithoutLast);

    // Resend the last user message
    setIsLoading(true);
    let assistantMessage = '';

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      // Format messages for API
      const formattedMessages = messagesWithoutLast.map((msg) => {
        if (msg.images && msg.images.length > 0) {
          return {
            role: msg.role,
            content: [
              { type: 'text', text: msg.content },
              ...msg.images.map((img) => ({
                type: 'image_url',
                image_url: { url: img },
              })),
            ],
          };
        }
        return { role: msg.role, content: msg.content };
      });

      const messagesWithSystem = customSettings.systemPrompt
        ? [
            { role: 'system', content: customSettings.systemPrompt },
            ...formattedMessages,
          ]
        : formattedMessages;

      const currentModel = models.find((m) => m.name === selectedModel);
      const requestBody: {
        model: string;
        messages: unknown[];
        stream: boolean;
        seed: number;
        temperature: number;
        reasoning_effort?: string;
      } = {
        model: selectedModel,
        messages: messagesWithSystem,
        stream: true,
        seed: Math.floor(Math.random() * 1000000),
        temperature: customSettings.temperature,
      };

      if (currentModel?.reasoning) {
        requestBody.reasoning_effort = customSettings.reasoningEffort;
      }

      const response = await fetch(
        'https://text.pollinations.ai/openai/chat/completions',
        {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

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
      if (assistantMessage) {
        generateFollowUpQuestions(assistantMessage);
      }
    }
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
              onClick={() => setShowSettings(!showSettings)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                background: showSettings
                  ? 'rgba(102, 126, 234, 0.8)'
                  : 'rgba(107, 114, 128, 0.8)',
                color: 'white',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              ⚙️ Settings
            </button>
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
              maxWidth: '250px',
            }}
            title={
              availableModels.find((m) => m.name === selectedModel)
                ?.description || ''
            }
          >
            {availableModels.map((model) => (
              <option
                key={model.name}
                value={model.name}
                style={{ color: 'black' }}
              >
                {model.description}
                {model.vision ? ' 👁️' : ''}
                {model.audio ? ' 🎤' : ''}
                {model.reasoning ? ' 🧠' : ''}
                {model.tier === 'seed' ? ' 🔑' : ''}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowApiKeyInput(!showApiKeyInput)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: `1px solid ${currentTheme.border}`,
              background: apiKey
                ? 'rgba(16, 185, 129, 0.2)'
                : currentTheme.messageBg,
              color: currentTheme.text,
              fontSize: '14px',
              cursor: 'pointer',
            }}
            title={apiKey ? 'API Key Set' : 'Set API Key'}
          >
            🔑 {apiKey ? '✓' : 'API Key'}
          </button>
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
        {showApiKeyInput && (
          <div
            style={{
              marginTop: '10px',
              padding: '12px',
              background: 'rgba(0, 0, 0, 0.1)',
              borderRadius: '8px',
            }}
          >
            <div
              style={{
                marginBottom: '8px',
                fontSize: '12px',
                color: currentTheme.text,
              }}
            >
              🔑 API Key (optional - unlocks seed-tier models)
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your Pollinations API key..."
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: `1px solid ${currentTheme.border}`,
                  background: currentTheme.messageBg,
                  color: currentTheme.text,
                  fontSize: '14px',
                }}
              />
              <button
                onClick={() => setApiKey('')}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'rgba(239, 68, 68, 0.8)',
                  color: 'white',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                Clear
              </button>
            </div>
            <div
              style={{
                marginTop: '8px',
                fontSize: '11px',
                color: currentTheme.text,
                opacity: 0.7,
              }}
            >
              💡 Seed-tier models (marked with 🔑) require an API key
            </div>
          </div>
        )}
        {showSettings && (
          <div
            style={{
              marginTop: '10px',
              padding: '12px',
              background: 'rgba(0, 0, 0, 0.1)',
              borderRadius: '8px',
            }}
          >
            <div
              style={{
                marginBottom: '12px',
                fontSize: '14px',
                fontWeight: 600,
                color: currentTheme.text,
              }}
            >
              ⚙️ Custom Settings
            </div>

            {/* System Prompt */}
            <div style={{ marginBottom: '12px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '12px',
                  color: currentTheme.text,
                }}
              >
                📝 System Prompt (optional)
              </label>
              <textarea
                value={customSettings.systemPrompt}
                onChange={(e) =>
                  setCustomSettings((prev) => ({
                    ...prev,
                    systemPrompt: e.target.value,
                  }))
                }
                placeholder="e.g., You are a helpful coding assistant..."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: `1px solid ${currentTheme.border}`,
                  background: currentTheme.messageBg,
                  color: currentTheme.text,
                  fontSize: '13px',
                  minHeight: '60px',
                  resize: 'vertical',
                }}
              />
            </div>

            {/* Temperature */}
            <div style={{ marginBottom: '12px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '12px',
                  color: currentTheme.text,
                }}
              >
                🌡️ Temperature: {customSettings.temperature.toFixed(1)}
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={customSettings.temperature}
                onChange={(e) =>
                  setCustomSettings((prev) => ({
                    ...prev,
                    temperature: parseFloat(e.target.value),
                  }))
                }
                style={{ width: '100%' }}
              />
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '10px',
                  color: currentTheme.text,
                  opacity: 0.6,
                  marginTop: '4px',
                }}
              >
                <span>Precise (0.0)</span>
                <span>Balanced (1.0)</span>
                <span>Creative (2.0)</span>
              </div>
            </div>

            {/* Reasoning Effort */}
            {models.find((m) => m.name === selectedModel)?.reasoning && (
              <div style={{ marginBottom: '12px' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '6px',
                    fontSize: '12px',
                    color: currentTheme.text,
                  }}
                >
                  🧠 Reasoning Effort
                </label>
                <select
                  value={customSettings.reasoningEffort}
                  onChange={(e) =>
                    setCustomSettings((prev) => ({
                      ...prev,
                      reasoningEffort: e.target.value as
                        | 'low'
                        | 'medium'
                        | 'high',
                    }))
                  }
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: `1px solid ${currentTheme.border}`,
                    background: currentTheme.messageBg,
                    color: currentTheme.text,
                    fontSize: '13px',
                  }}
                >
                  <option value="low">Low - Faster</option>
                  <option value="medium">Medium - Balanced</option>
                  <option value="high">High - More thorough</option>
                </select>
              </div>
            )}

            <div
              style={{
                fontSize: '11px',
                color: currentTheme.text,
                opacity: 0.7,
              }}
            >
              💡 Settings are saved automatically
            </div>
          </div>
        )}
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

      {/* Follow-up Questions */}
      {(followUpQuestions.length > 0 || isGeneratingQuestions) && (
        <div
          style={{
            padding: '12px 20px',
            background: currentTheme.headerBg,
            borderTop: `1px solid ${currentTheme.border}`,
          }}
        >
          <div
            style={{
              fontSize: '12px',
              color: currentTheme.text,
              marginBottom: '8px',
              opacity: 0.8,
            }}
          >
            💡 Suggested follow-up questions:
          </div>
          <div
            style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
            }}
          >
            {isGeneratingQuestions ? (
              <div
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  background: 'rgba(102, 126, 234, 0.2)',
                  color: currentTheme.text,
                  fontSize: '13px',
                }}
              >
                ⏳ Generating questions...
              </div>
            ) : (
              followUpQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => sendFollowUpQuestion(question)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: `1px solid ${currentTheme.border}`,
                    background: currentTheme.messageBg,
                    color: currentTheme.text,
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      'rgba(102, 126, 234, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = currentTheme.messageBg;
                  }}
                >
                  {question}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Input */}
      <div
        style={{
          padding: '20px',
          background: currentTheme.headerBg,
          backdropFilter: 'blur(10px)',
          borderTop: `1px solid ${currentTheme.border}`,
        }}
      >
        {/* Image Preview */}
        {uploadedImages.length > 0 && (
          <div
            style={{
              marginBottom: '12px',
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
            }}
          >
            {uploadedImages.map((img, index) => (
              <div
                key={index}
                style={{
                  position: 'relative',
                  width: '80px',
                  height: '80px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  border: `2px solid ${currentTheme.border}`,
                }}
              >
                <img
                  src={img}
                  alt={`Upload ${index + 1}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
                <button
                  onClick={() => removeImage(index)}
                  style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    border: 'none',
                    background: 'rgba(239, 68, 68, 0.9)',
                    color: 'white',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
          {/* Image Upload Button */}
          {models.find((m) => m.name === selectedModel)?.vision && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  border: 'none',
                  background:
                    uploadedImages.length > 0
                      ? 'rgba(16, 185, 129, 0.8)'
                      : currentTheme.messageBg,
                  color: currentTheme.text,
                  fontSize: '20px',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                }}
                title="Upload images"
              >
                🖼️
              </button>
            </>
          )}
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
