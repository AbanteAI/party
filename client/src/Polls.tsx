import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface Poll {
  id: number;
  question: string;
  options: string[];
  votes: { [option: string]: string[] };
  createdBy: string;
  createdAt: string;
}

function Polls() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [username, setUsername] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newOptions, setNewOptions] = useState(['', '']);

  // Load username from localStorage
  useEffect(() => {
    const savedUsername = localStorage.getItem('chatUsername');
    if (savedUsername) {
      setUsername(savedUsername);
    }
  }, []);

  // Fetch polls
  useEffect(() => {
    const fetchPolls = async () => {
      try {
        const response = await fetch('/api/polls');
        if (response.ok) {
          const data = await response.json();
          setPolls(data);
        }
      } catch (err) {
        console.error('Error fetching polls:', err);
      }
    };

    fetchPolls();
    const interval = setInterval(fetchPolls, 2000);
    return () => clearInterval(interval);
  }, []);

  const createPoll = async () => {
    if (!newQuestion.trim() || newOptions.filter((o) => o.trim()).length < 2) {
      return;
    }

    try {
      const response = await fetch('/api/polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: newQuestion,
          options: newOptions.filter((o) => o.trim()),
          createdBy: username,
        }),
      });

      if (response.ok) {
        setNewQuestion('');
        setNewOptions(['', '']);
        setShowCreateForm(false);
      }
    } catch (err) {
      console.error('Error creating poll:', err);
    }
  };

  const vote = async (pollId: number, option: string) => {
    if (!username) return;

    try {
      await fetch(`/api/polls/${pollId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, option }),
      });
    } catch (err) {
      console.error('Error voting:', err);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        padding: '40px 20px',
      }}
    >
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
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
            📊 Polls
          </h1>
        </div>

        {/* Username Input */}
        {!username && (
          <div
            style={{
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: '20px',
              padding: '30px',
              marginBottom: '20px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
            }}
          >
            <input
              type="text"
              placeholder="Enter your name to vote..."
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

        {/* Create Poll Button */}
        {username && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            style={{
              width: '100%',
              padding: '15px',
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(10px)',
              border: 'none',
              borderRadius: '20px',
              fontSize: '16px',
              fontWeight: '600',
              color: '#333',
              cursor: 'pointer',
              marginBottom: '20px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
            }}
          >
            {showCreateForm ? '✕ Cancel' : '+ Create New Poll'}
          </button>
        )}

        {/* Create Poll Form */}
        {showCreateForm && (
          <div
            style={{
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: '20px',
              padding: '30px',
              marginBottom: '20px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
            }}
          >
            <input
              type="text"
              placeholder="Poll question..."
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                marginBottom: '15px',
              }}
            />
            {newOptions.map((option, index) => (
              <input
                key={index}
                type="text"
                placeholder={`Option ${index + 1}...`}
                value={option}
                onChange={(e) => {
                  const updated = [...newOptions];
                  updated[index] = e.target.value;
                  setNewOptions(updated);
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  marginBottom: '10px',
                }}
              />
            ))}
            <button
              onClick={() => setNewOptions([...newOptions, ''])}
              style={{
                width: '100%',
                padding: '10px',
                background: '#f8fafc',
                border: '2px dashed #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#666',
                cursor: 'pointer',
                marginBottom: '15px',
              }}
            >
              + Add Option
            </button>
            <button
              onClick={createPoll}
              style={{
                width: '100%',
                padding: '12px',
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Create Poll
            </button>
          </div>
        )}

        {/* Polls List */}
        {polls.length === 0 ? (
          <div
            style={{
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: '20px',
              padding: '40px',
              textAlign: 'center',
              color: '#999',
              boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
            }}
          >
            No polls yet. Create the first one!
          </div>
        ) : (
          polls.map((poll) => {
            const totalVotes = Object.values(poll.votes).reduce(
              (sum, voters) => sum + voters.length,
              0
            );
            const userVote = username
              ? Object.entries(poll.votes).find(([, voters]) =>
                  voters.includes(username)
                )?.[0]
              : null;

            return (
              <div
                key={poll.id}
                style={{
                  background: 'rgba(255,255,255,0.95)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '20px',
                  padding: '30px',
                  marginBottom: '20px',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                }}
              >
                <h3
                  style={{
                    fontSize: '20px',
                    fontWeight: '600',
                    color: '#333',
                    marginBottom: '15px',
                  }}
                >
                  {poll.question}
                </h3>
                <div style={{ marginBottom: '15px' }}>
                  {poll.options.map((option) => {
                    const votes = poll.votes[option]?.length || 0;
                    const percentage =
                      totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
                    const isUserVote = userVote === option;

                    return (
                      <div
                        key={option}
                        onClick={() => !userVote && vote(poll.id, option)}
                        style={{
                          padding: '12px',
                          marginBottom: '10px',
                          background: isUserVote ? '#4facfe' : '#f8fafc',
                          color: isUserVote ? 'white' : '#333',
                          borderRadius: '8px',
                          cursor: userVote ? 'default' : 'pointer',
                          position: 'relative',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            height: '100%',
                            width: `${percentage}%`,
                            background: isUserVote
                              ? 'rgba(255,255,255,0.2)'
                              : 'rgba(79,172,254,0.1)',
                            transition: 'width 0.3s ease',
                          }}
                        />
                        <div
                          style={{
                            position: 'relative',
                            display: 'flex',
                            justifyContent: 'space-between',
                          }}
                        >
                          <span>{option}</span>
                          <span>
                            {votes} ({percentage.toFixed(0)}%)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ fontSize: '12px', color: '#999' }}>
                  Created by {poll.createdBy} • {totalVotes} votes
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default Polls;
