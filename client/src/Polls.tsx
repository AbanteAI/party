import { useState, useEffect } from 'react';

interface Poll {
  id: string;
  question: string;
  options: { id: string; text: string; votes: number }[];
  totalVotes: number;
  createdBy: string;
  createdAt: Date;
}

export default function Polls() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newOptions, setNewOptions] = useState(['', '']);
  const [votedPolls, setVotedPolls] = useState<Set<string>>(new Set());

  // Load polls from localStorage
  useEffect(() => {
    const savedPolls = localStorage.getItem('mentat-polls');
    const savedVotes = localStorage.getItem('mentat-poll-votes');

    if (savedPolls) {
      const parsedPolls = JSON.parse(savedPolls);
      setPolls(
        parsedPolls.map((p: Poll) => ({
          ...p,
          createdAt: new Date(p.createdAt),
        }))
      );
    } else {
      // Default polls
      const defaultPolls: Poll[] = [
        {
          id: '1',
          question: 'What feature should we add next?',
          options: [
            { id: '1a', text: 'More Games', votes: 12 },
            { id: '1b', text: 'Social Features', votes: 8 },
            { id: '1c', text: 'Customization', votes: 15 },
            { id: '1d', text: 'Mobile App', votes: 20 },
          ],
          totalVotes: 55,
          createdBy: 'Mentat Team',
          createdAt: new Date(),
        },
      ];
      setPolls(defaultPolls);
    }

    if (savedVotes) {
      setVotedPolls(new Set(JSON.parse(savedVotes)));
    }
  }, []);

  // Save polls to localStorage
  useEffect(() => {
    if (polls.length > 0) {
      localStorage.setItem('mentat-polls', JSON.stringify(polls));
    }
  }, [polls]);

  // Save voted polls to localStorage
  useEffect(() => {
    localStorage.setItem(
      'mentat-poll-votes',
      JSON.stringify(Array.from(votedPolls))
    );
  }, [votedPolls]);

  const createPoll = () => {
    if (!newQuestion.trim() || newOptions.filter((o) => o.trim()).length < 2) {
      alert('Please enter a question and at least 2 options');
      return;
    }

    const poll: Poll = {
      id: Date.now().toString(),
      question: newQuestion,
      options: newOptions
        .filter((o) => o.trim())
        .map((text, i) => ({
          id: `${Date.now()}-${i}`,
          text,
          votes: 0,
        })),
      totalVotes: 0,
      createdBy: 'You',
      createdAt: new Date(),
    };

    setPolls([poll, ...polls]);
    setNewQuestion('');
    setNewOptions(['', '']);
    setShowCreateModal(false);
  };

  const vote = (pollId: string, optionId: string) => {
    if (votedPolls.has(pollId)) {
      alert('You have already voted on this poll!');
      return;
    }

    setPolls(
      polls.map((poll) => {
        if (poll.id === pollId) {
          return {
            ...poll,
            options: poll.options.map((opt) =>
              opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
            ),
            totalVotes: poll.totalVotes + 1,
          };
        }
        return poll;
      })
    );

    setVotedPolls(new Set([...votedPolls, pollId]));
  };

  const addOption = () => {
    setNewOptions([...newOptions, '']);
  };

  const removeOption = (index: number) => {
    if (newOptions.length > 2) {
      setNewOptions(newOptions.filter((_, i) => i !== index));
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
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
          📊 Polls
        </h1>
        <p
          style={{
            fontSize: '18px',
            color: 'rgba(255,255,255,0.9)',
            textAlign: 'center',
            marginBottom: '20px',
          }}
        >
          Create and vote on polls
        </p>

        {/* Create Poll Button */}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: '15px 30px',
              borderRadius: '15px',
              border: 'none',
              background: 'rgba(255,255,255,0.95)',
              color: '#1f2937',
              fontWeight: 'bold',
              fontSize: '16px',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
            }}
          >
            ➕ Create New Poll
          </button>
        </div>
      </div>

      {/* Polls List */}
      <div
        style={{
          maxWidth: '800px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '25px',
        }}
      >
        {polls.map((poll) => (
          <div
            key={poll.id}
            style={{
              background: 'rgba(255,255,255,0.95)',
              borderRadius: '20px',
              padding: '30px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            }}
          >
            {/* Question */}
            <h3
              style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#1f2937',
                marginBottom: '10px',
              }}
            >
              {poll.question}
            </h3>

            {/* Meta Info */}
            <div
              style={{
                fontSize: '12px',
                color: '#6b7280',
                marginBottom: '20px',
              }}
            >
              Created by {poll.createdBy} • {poll.totalVotes} votes
            </div>

            {/* Options */}
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
            >
              {poll.options.map((option) => {
                const percentage =
                  poll.totalVotes > 0
                    ? (option.votes / poll.totalVotes) * 100
                    : 0;
                const hasVoted = votedPolls.has(poll.id);

                return (
                  <div
                    key={option.id}
                    onClick={() => !hasVoted && vote(poll.id, option.id)}
                    style={{
                      position: 'relative',
                      padding: '15px 20px',
                      borderRadius: '10px',
                      border: '2px solid #e5e7eb',
                      cursor: hasVoted ? 'default' : 'pointer',
                      transition: 'all 0.3s ease',
                      overflow: 'hidden',
                    }}
                    onMouseEnter={(e) => {
                      if (!hasVoted) {
                        e.currentTarget.style.borderColor = '#667eea';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                    }}
                  >
                    {/* Progress Bar */}
                    {hasVoted && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          bottom: 0,
                          width: `${percentage}%`,
                          background:
                            'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                          opacity: 0.2,
                          transition: 'width 0.5s ease',
                        }}
                      />
                    )}

                    {/* Option Content */}
                    <div
                      style={{
                        position: 'relative',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '16px',
                          color: '#1f2937',
                          fontWeight: hasVoted ? 'bold' : 'normal',
                        }}
                      >
                        {option.text}
                      </span>
                      {hasVoted && (
                        <span
                          style={{
                            fontSize: '14px',
                            fontWeight: 'bold',
                            color: '#667eea',
                          }}
                        >
                          {option.votes} ({percentage.toFixed(1)}%)
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Create Poll Modal */}
      {showCreateModal && (
        <div
          onClick={() => setShowCreateModal(false)}
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
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
          >
            <h2
              style={{
                fontSize: '28px',
                fontWeight: 'bold',
                color: '#1f2937',
                marginBottom: '20px',
              }}
            >
              Create New Poll
            </h2>

            {/* Question Input */}
            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#1f2937',
                  marginBottom: '8px',
                }}
              >
                Question
              </label>
              <input
                type="text"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="What's your question?"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '2px solid #e5e7eb',
                  fontSize: '16px',
                }}
              />
            </div>

            {/* Options */}
            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#1f2937',
                  marginBottom: '8px',
                }}
              >
                Options
              </label>
              {newOptions.map((option, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    gap: '10px',
                    marginBottom: '10px',
                  }}
                >
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => {
                      const updated = [...newOptions];
                      updated[index] = e.target.value;
                      setNewOptions(updated);
                    }}
                    placeholder={`Option ${index + 1}`}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '10px',
                      border: '2px solid #e5e7eb',
                      fontSize: '16px',
                    }}
                  />
                  {newOptions.length > 2 && (
                    <button
                      onClick={() => removeOption(index)}
                      style={{
                        padding: '12px',
                        borderRadius: '10px',
                        border: 'none',
                        background: '#ef4444',
                        color: 'white',
                        cursor: 'pointer',
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addOption}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '2px dashed #e5e7eb',
                  background: 'transparent',
                  color: '#6b7280',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                + Add Option
              </button>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={createPoll}
                style={{
                  flex: 1,
                  padding: '15px',
                  borderRadius: '10px',
                  border: 'none',
                  background:
                    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  cursor: 'pointer',
                }}
              >
                Create Poll
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{
                  flex: 1,
                  padding: '15px',
                  borderRadius: '10px',
                  border: '2px solid #e5e7eb',
                  background: 'white',
                  color: '#6b7280',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
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
