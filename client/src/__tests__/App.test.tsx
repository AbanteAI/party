import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

// Define types
interface Message {
  id: number;
  username: string;
  message: string;
  timestamp: string;
  reactions: { [emoji: string]: string[] };
}

// Mock the fetch API
globalThis.fetch = vi.fn() as unknown as typeof fetch;

function mockFetchResponse(data: Message[]) {
  return {
    json: vi.fn().mockResolvedValue(data),
    ok: true,
  };
}

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // Default mock implementation - empty messages
    (globalThis.fetch as unknown as Mock).mockResolvedValue(
      mockFetchResponse([])
    );
  });

  it('renders chat interface correctly', () => {
    render(<App />);
    expect(screen.getByText('mentat party 🥳')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Type a message...')
    ).toBeInTheDocument();
    expect(screen.getByText('Send')).toBeInTheDocument();
  });

  it('loads and displays messages', async () => {
    const mockMessages: Message[] = [
      {
        id: 1,
        username: 'TestUser',
        message: 'Hello World',
        timestamp: new Date().toISOString(),
        reactions: {},
      },
    ];

    (globalThis.fetch as unknown as Mock).mockResolvedValue(
      mockFetchResponse(mockMessages)
    );

    render(<App />);

    // Wait for messages to load
    await waitFor(() => {
      expect(screen.getByText('TestUser')).toBeInTheDocument();
      expect(screen.getByText('Hello World')).toBeInTheDocument();
    });

    expect(globalThis.fetch).toHaveBeenCalledWith('/api/messages');
  });

  it('sends a message when form is submitted', async () => {
    const user = userEvent.setup();

    // Mock successful message post and get
    (globalThis.fetch as unknown as Mock).mockImplementation(
      (_url: string, options?: RequestInit) => {
        if (options?.method === 'POST') {
          // POST request - return single message
          return Promise.resolve({
            json: vi.fn().mockResolvedValue({
              id: 2,
              username: 'TestUser',
              message: 'New message',
              timestamp: new Date().toISOString(),
              reactions: {},
            }),
            ok: true,
          });
        }
        // GET request - return array of messages
        return Promise.resolve(mockFetchResponse([]));
      }
    );

    render(<App />);

    const usernameInput = screen.getByPlaceholderText('Username');
    const messageInput = screen.getByPlaceholderText('Type a message...');
    const sendButton = screen.getByText('Send');

    // Type username and message
    await user.type(usernameInput, 'TestUser');
    await user.type(messageInput, 'New message');

    // Submit form
    await user.click(sendButton);

    // Verify fetch was called with correct data
    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/messages',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: 'TestUser',
            message: 'New message',
          }),
        })
      );
    });
  });
});
