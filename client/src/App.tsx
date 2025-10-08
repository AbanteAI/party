import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface Message {
  id: number;
  username: string;
  message: string;
  timestamp: string;
  reactions: { [emoji: string]: string[] };
  snakeScore: number;
}

interface Poll {
  id: number;
  question: string;
  options: string[];
  votes: { [option: string]: string[] };
  createdBy: string;
  createdAt: string;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [username, setUsername] = useState('');
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPollForm, setShowPollForm] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [stockData, setStockData] = useState<{
    labels: string[];
    prices: number[];
    currentPrice: number;
    change: number;
    changePercent: number;
  } | null>(null);
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

  const fetchPolls = useCallback(async () => {
    try {
      const response = await fetch('/api/polls');
      if (response.ok) {
        const data = await response.json();
        setPolls(data);
      }
    } catch (err) {
      console.error('Error fetching polls:', err);
    }
  }, []);

  useEffect(() => {
    fetchPolls();
    const interval = setInterval(fetchPolls, 3000);
    return () => clearInterval(interval);
  }, [fetchPolls]);

  const createPoll = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedUsername = username.trim();
    const trimmedQuestion = pollQuestion.trim();
    const trimmedOptions = pollOptions
      .map((opt) => opt.trim())
      .filter((opt) => opt.length > 0);

    if (!trimmedUsername) {
      alert('Please enter a username first!');
      return;
    }

    if (!trimmedQuestion || trimmedOptions.length < 2) {
      alert('Please enter a question and at least 2 options!');
      return;
    }

    try {
      const response = await fetch('/api/polls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: trimmedQuestion,
          options: trimmedOptions,
          username: trimmedUsername,
        }),
      });

      if (response.ok) {
        setPollQuestion('');
        setPollOptions(['', '']);
        setShowPollForm(false);
        await fetchPolls();
      }
    } catch (err) {
      console.error('Error creating poll:', err);
    }
  };

  const vote = async (pollId: number, option: string) => {
    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      alert('Please enter a username first!');
      return;
    }

    try {
      const response = await fetch(`/api/polls/${pollId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          option,
          username: trimmedUsername,
        }),
      });

      if (response.ok) {
        await fetchPolls();
      }
    } catch (err) {
      console.error('Error voting:', err);
    }
  };

  const fetchStockData = useCallback(async () => {
    try {
      const response = await fetch('/api/stock/TSLA');
      if (response.ok) {
        const data = await response.json();
        const result = data.chart.result[0];
        const timestamps = result.timestamp;
        const prices = result.indicators.quote[0].close;

        // Format dates and filter out null prices
        const labels: string[] = [];
        const validPrices: number[] = [];

        timestamps.forEach((ts: number, i: number) => {
          if (prices[i] !== null) {
            const date = new Date(ts * 1000);
            labels.push(
              date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })
            );
            validPrices.push(prices[i]);
          }
        });

        const currentPrice = validPrices[validPrices.length - 1];
        const previousPrice = validPrices[validPrices.length - 2];
        const change = currentPrice - previousPrice;
        const changePercent = (change / previousPrice) * 100;

        setStockData({
          labels,
          prices: validPrices,
          currentPrice,
          change,
          changePercent,
        });
      }
    } catch (err) {
      console.error('Error fetching stock data:', err);
    }
  }, []);

  useEffect(() => {
    fetchStockData();
    const interval = setInterval(fetchStockData, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [fetchStockData]);

  return (
    <div
      style={{
        backgroundColor: '#fafafa',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div
        className="paper"
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '20px',
          overflow: 'hidden',
        }}
      >
        <h1 style={{ marginBottom: '20px' }}>mentat party 🥳</h1>

        {/* Stock Chart */}
        {stockData && (
          <div
            style={{
              marginBottom: '15px',
              padding: '15px',
              backgroundColor: 'white',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
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
              <div>
                <div
                  style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#1f2937',
                  }}
                >
                  TSLA
                </div>
                <div
                  style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    color: '#1f2937',
                  }}
                >
                  ${stockData.currentPrice.toFixed(2)}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div
                  style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: stockData.change >= 0 ? '#10b981' : '#ef4444',
                  }}
                >
                  {stockData.change >= 0 ? '+' : ''}$
                  {stockData.change.toFixed(2)} (
                  {stockData.changePercent.toFixed(2)}%)
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  Last 30 days
                </div>
              </div>
            </div>
            <div style={{ height: '150px' }}>
              <Line
                data={{
                  labels: stockData.labels,
                  datasets: [
                    {
                      label: 'TSLA Price',
                      data: stockData.prices,
                      borderColor: '#3b82f6',
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      fill: true,
                      tension: 0.4,
                      pointRadius: 0,
                      borderWidth: 2,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                    tooltip: {
                      mode: 'index',
                      intersect: false,
                    },
                  },
                  scales: {
                    x: {
                      display: true,
                      grid: {
                        display: false,
                      },
                      ticks: {
                        maxTicksLimit: 6,
                      },
                    },
                    y: {
                      display: true,
                      grid: {
                        color: '#f3f4f6',
                      },
                    },
                  },
                }}
              />
            </div>
          </div>
        )}

        {/* Poll creation button */}
        <button
          onClick={() => setShowPollForm(!showPollForm)}
          style={{
            marginBottom: '10px',
            padding: '8px 16px',
            borderRadius: '6px',
            border: '1px solid #d1d5db',
            backgroundColor: showPollForm ? '#dbeafe' : 'white',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            color: '#1f2937',
          }}
        >
          📊 {showPollForm ? 'Cancel Poll' : 'Create Poll'}
        </button>

        {/* Poll creation form */}
        {showPollForm && (
          <div
            style={{
              marginBottom: '10px',
              padding: '15px',
              backgroundColor: 'white',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
            }}
          >
            <form onSubmit={createPoll}>
              <input
                type="text"
                placeholder="Poll question..."
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  marginBottom: '10px',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  fontSize: '14px',
                }}
              />
              {pollOptions.map((option, index) => (
                <div
                  key={index}
                  style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}
                >
                  <input
                    type="text"
                    placeholder={`Option ${index + 1}...`}
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...pollOptions];
                      newOptions[index] = e.target.value;
                      setPollOptions(newOptions);
                    }}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      fontSize: '14px',
                    }}
                  />
                  {pollOptions.length > 2 && (
                    <button
                      type="button"
                      onClick={() => {
                        const newOptions = pollOptions.filter(
                          (_, i) => i !== index
                        );
                        setPollOptions(newOptions);
                      }}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #d1d5db',
                        backgroundColor: 'white',
                        fontSize: '14px',
                        cursor: 'pointer',
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setPollOptions([...pollOptions, ''])}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    backgroundColor: 'white',
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  + Add Option
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                  }}
                >
                  Create Poll
                </button>
              </div>
            </form>
          </div>
        )}

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
          {/* Polls */}
          {polls.map((poll) => {
            // Safety checks for incomplete poll data
            if (!poll.options || !poll.votes) {
              return null;
            }

            const totalVotes = Object.values(poll.votes).reduce(
              (sum, voters) => sum + voters.length,
              0
            );
            const userVote = Object.entries(poll.votes).find(([, voters]) =>
              voters.includes(username.trim())
            )?.[0];

            return (
              <div
                key={poll.id}
                style={{
                  marginBottom: '12px',
                  padding: '12px',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  border: '2px solid #3b82f6',
                }}
              >
                <div
                  style={{
                    fontWeight: '600',
                    fontSize: '15px',
                    color: '#1f2937',
                    marginBottom: '8px',
                  }}
                >
                  📊 {poll.question}
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    color: '#6b7280',
                    marginBottom: '10px',
                  }}
                >
                  by {poll.createdBy} • {totalVotes} vote
                  {totalVotes !== 1 ? 's' : ''}
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  {poll.options.map((option) => {
                    const votes = poll.votes[option]?.length || 0;
                    const percentage =
                      totalVotes > 0
                        ? Math.round((votes / totalVotes) * 100)
                        : 0;
                    const isUserVote = userVote === option;

                    return (
                      <button
                        key={option}
                        onClick={() => vote(poll.id, option)}
                        style={{
                          padding: '10px',
                          borderRadius: '6px',
                          border: isUserVote
                            ? '2px solid #3b82f6'
                            : '1px solid #d1d5db',
                          backgroundColor: isUserVote ? '#dbeafe' : 'white',
                          fontSize: '14px',
                          cursor: 'pointer',
                          textAlign: 'left',
                          position: 'relative',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            bottom: 0,
                            width: `${percentage}%`,
                            backgroundColor: isUserVote ? '#93c5fd' : '#e5e7eb',
                            transition: 'width 0.3s ease',
                            zIndex: 0,
                          }}
                        />
                        <div
                          style={{
                            position: 'relative',
                            zIndex: 1,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <span>
                            {isUserVote && '✓ '}
                            {option}
                          </span>
                          <span style={{ fontWeight: '600', color: '#6b7280' }}>
                            {percentage}% ({votes})
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Messages */}
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
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span>{msg.username}</span>
                {msg.snakeScore > 0 && (
                  <span
                    style={{
                      fontSize: '12px',
                      color: '#667eea',
                      backgroundColor: '#f0f4ff',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontWeight: '500',
                    }}
                  >
                    🐍 {msg.snakeScore}
                  </span>
                )}
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
                {['👍', '❤️', '😂', '🎉', '🔥', '🚀']
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
