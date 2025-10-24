import { useState, useRef, useEffect } from 'react';
import { marked } from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';
import {
  Settings,
  Key,
  Trash2,
  Copy,
  Edit3,
  RotateCcw,
  Send,
  Loader2,
  Brain,
  Zap,
  Circle,
  ChevronRight,
  ChevronDown,
  Image as ImageIcon,
  Bot,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';

// Configure marked to handle citations properly
marked.setOptions({
  breaks: true,
  gfm: true,
});

// Helper function to escape citations in markdown
const escapeCitations = (text: string): string => {
  // Escape patterns like [Source: ...] or [Citation: ...] or [1], [2], etc.
  return text.replace(/\[([^\]]+)\]/g, (match, content) => {
    // Check if it looks like a citation (contains "Source:", "Citation:", or is just a number)
    if (
      content.match(/^(Source|Citation|Ref|Reference):/i) ||
      content.match(/^\d+$/)
    ) {
      // Escape the brackets
      return `\\[${content}\\]`;
    }
    // Otherwise, leave it as is (might be a valid markdown link)
    return match;
  });
};

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

type ResponseMode = 'none' | 'reason' | 'rush';

type Theme = 'light' | 'dark' | 'purple' | 'ocean' | 'forest' | 'openwebui';

const MODE_PROMPTS = {
  none: '',
  reason: `You are a Reasoning Engine. Your purpose is to solve problems through genuine, step-by-step logical deduction. Avoid superficial reasoning, token-wasting commentary, and post-hoc justifications.

**Core Reasoning Framework:**

1. PROBLEM DECOMPOSITION
- Identify the core question and key constraints
- Extract relevant variables and relationships
- Ignore irrelevant information
- Restate the problem in simpler terms if needed

2. LOGICAL CONSTRUCTION
- Build reasoning from first principles
- Use appropriate representations (equations, logical statements)
- Make implicit assumptions explicit
- Connect each step with clear logical dependencies

3. STEP-BY-STEP EXECUTION
- Progress through deductive steps
- Show calculations when applicable
- Avoid jumping to conclusions
- Maintain logical coherence between steps

4. VERIFICATION & CRITIQUE
- Check if the solution satisfies original conditions
- Identify potential edge cases or alternative interpretations
- Acknowledge uncertainties or limitations in the reasoning

**Output Format:**

Use <think></think> tags for your reasoning process:

<think>
[Essential step 1: Define variables/assumptions]
[Essential step 2: Establish relationships]
[Essential step 3: Logical progression]
[Essential step 4: Solution derivation]
[Verification: Quick sanity check]
</think>

[Clear, concise final answer]

**Critical Prohibitions:**

❌ NEVER use these patterns:
- "The user is asking..." or "I need to find..."
- "Let me think about this..." or "I will now calculate..."
- Empty paraphrasing of the problem
- Narrative self-commentary about your thought process
- Redundant verification that just repeats the calculation

✅ ALWAYS do this:
- Start reasoning immediately with substantive steps
- Use minimal but clear language
- Make logical connections explicit
- Focus on the mathematical/logical structure, not the narrative

**Example:**

Problem: "If a rectangle's length is twice its width, and the perimeter is 30 units, what is the area?"

<think>
Let width = w, length = 2w
Perimeter formula: 2(w + 2w) = 30
Simplify: 2(3w) = 30 → 6w = 30
Solve: w = 5, length = 10
Area = 5 × 10 = 50
Verify: Perimeter = 2(5 + 10) = 30 ✓
</think>

The area is 50 square units.`,
  rush: 'Respond quickly and concisely. Get straight to the point. Prioritize speed and brevity over detailed explanations.',
};

const WEB_SEARCH_PROMPT =
  'You have access to web search. When you need current information or want to search the web, use this format: [SEARCH: your search query]. The system will perform the search and provide you with results. Always cite your sources when using search results.';

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
    iconPrimary: '#667eea',
    iconSecondary: '#10b981',
    iconAccent: '#f59e0b',
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
    iconPrimary: '#818cf8',
    iconSecondary: '#34d399',
    iconAccent: '#fbbf24',
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
    iconPrimary: '#c084fc',
    iconSecondary: '#60efff',
    iconAccent: '#fcd34d',
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
    iconPrimary: '#06b6d4',
    iconSecondary: '#10b981',
    iconAccent: '#f59e0b',
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
    iconPrimary: '#10b981',
    iconSecondary: '#06b6d4',
    iconAccent: '#f59e0b',
  },
  openwebui: {
    bg: '#fafbfc',
    headerBg: '#f0f2f5',
    headerText: '#1a202c',
    messageBg: '#f7f8fa',
    userBg: '#2563eb',
    assistantBg: '#ffffff',
    text: '#1a202c',
    userText: 'white',
    border: '#d1d5db',
    iconPrimary: '#2563eb',
    iconSecondary: '#059669',
    iconAccent: '#dc2626',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    buttonRadius: '6px',
    buttonStyle: 'flat',
  },
};

// Component to display live image animation
function LiveImageDisplay({ imageUrls }: { imageUrls: string[] }) {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [hasPlayed, setHasPlayed] = useState(false);

  useEffect(() => {
    if (hasPlayed) return;

    const interval = setInterval(() => {
      setCurrentFrame((prev) => {
        if (prev >= imageUrls.length - 1) {
          clearInterval(interval);
          setHasPlayed(true);
          return prev;
        }
        return prev + 1;
      });
    }, 200); // 200ms per frame = 5 fps

    return () => clearInterval(interval);
  }, [imageUrls.length, hasPlayed]);

  return (
    <div style={{ position: 'relative' }}>
      <img
        src={imageUrls[currentFrame]}
        alt={`Frame ${currentFrame + 1}`}
        style={{
          width: '100%',
          borderRadius: '8px',
          display: 'block',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '8px',
          right: '8px',
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
        }}
      >
        Frame {currentFrame + 1}/{imageUrls.length}
      </div>
    </div>
  );
}

interface ChatProps {
  currentUser: string | null;
}

export default function Chat({ currentUser }: ChatProps) {
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
  const [followUpsCollapsed, setFollowUpsCollapsed] = useState(false);
  const [responseMode, setResponseMode] = useState<ResponseMode>('none');
  const [toasts, setToasts] = useState<
    Array<{ id: string; message: string; type: 'success' | 'error' | 'info' }>
  >([]);
  const [expandedThinking, setExpandedThinking] = useState<{
    [key: string]: boolean;
  }>({});
  const [thinkingTimestamps, setThinkingTimestamps] = useState<{
    [key: string]: { start: number; end?: number };
  }>({});
  const [codeOutputs, setCodeOutputs] = useState<{
    [key: string]: { output: string; error?: string };
  }>({});
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [showImageGenerator, setShowImageGenerator] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(
    null
  );
  const [enhancedPrompt, setEnhancedPrompt] = useState<string>('');
  const [imageReasoning, setImageReasoning] = useState<string>('');
  const [showPrompt, setShowPrompt] = useState(false);
  const [showReasoning, setShowReasoning] = useState(false);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [liveImage, setLiveImage] = useState(false);
  const [liveImageProgress, setLiveImageProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [generatedGifUrl, setGeneratedGifUrl] = useState<string | null>(null);
  // @ts-expect-error - Will be used when chat list UI is added
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [chatList, setChatList] = useState<
    Array<{
      id: string;
      title: string;
      updatedAt: number;
    }>
  >([]);
  const [showChatList, setShowChatList] = useState(false);
  const [communityModels, setCommunityModels] = useState<
    Array<{
      id: string;
      name: string;
      endpoint: string;
      apiKey: string;
      creator: string;
      allowSystemPrompts: {
        reasoning: boolean;
        rush: boolean;
        personality: boolean;
        custom: boolean;
      };
    }>
  >([]);
  const [showAddModel, setShowAddModel] = useState(false);
  const [editingModelId, setEditingModelId] = useState<string | null>(null);
  const [newModelId, setNewModelId] = useState('');
  const [newModelName, setNewModelName] = useState('');
  const [newModelEndpoint, setNewModelEndpoint] = useState('');
  const [newModelApiKey, setNewModelApiKey] = useState('');
  const [newModelAllowSystemPrompts, setNewModelAllowSystemPrompts] = useState({
    reasoning: true,
    rush: true,
    personality: true,
    custom: true,
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Toast notification helper
  const showToast = (
    message: string,
    type: 'success' | 'error' | 'info' = 'info'
  ) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  // Load saved data
  useEffect(() => {
    const saved = localStorage.getItem('chat-messages');
    const savedTheme = localStorage.getItem('chat-theme');
    const savedApiKey = localStorage.getItem('chat-api-key');
    const savedSettings = localStorage.getItem('chat-custom-settings');
    const savedMode = localStorage.getItem('chat-response-mode');

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
    if (savedMode) {
      setResponseMode(savedMode as ResponseMode);
    }

    // Load community models
    const savedCommunityModels = localStorage.getItem('community-models');
    if (savedCommunityModels) {
      try {
        setCommunityModels(JSON.parse(savedCommunityModels));
      } catch (e) {
        console.error('Failed to load community models:', e);
      }
    }
  }, []);

  // Save community models to localStorage
  useEffect(() => {
    localStorage.setItem('community-models', JSON.stringify(communityModels));
  }, [communityModels]);

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

  // Load chat list when user logs in
  useEffect(() => {
    if (currentUser) {
      loadChatList();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

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

  // Save response mode
  useEffect(() => {
    localStorage.setItem('chat-response-mode', responseMode);
  }, [responseMode]);

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

      // Check if this is a community model and get its settings
      const communityModel = communityModels.find(
        (m) => m.id === selectedModel
      );

      // Helper function to perform web search
      const performWebSearch = async (query: string): Promise<string> => {
        try {
          const response = await fetch(
            `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json`
          );
          const data = await response.json();

          // Format results
          let results = `\n\n[SEARCH RESULTS for "${query}"]\n\n`;

          if (data.AbstractText) {
            results += `**Summary:** ${data.AbstractText}\n`;
            if (data.AbstractURL) {
              results += `Source: ${data.AbstractURL}\n`;
            }
            results += '\n';
          }

          if (data.RelatedTopics && data.RelatedTopics.length > 0) {
            results += '**Related Information:**\n';
            data.RelatedTopics.slice(0, 5).forEach(
              (topic: { Text?: string; FirstURL?: string }, idx: number) => {
                if (topic.Text) {
                  results += `${idx + 1}. ${topic.Text}\n`;
                  if (topic.FirstURL) {
                    results += `   ${topic.FirstURL}\n`;
                  }
                }
              }
            );
          }

          results += '\n[END SEARCH RESULTS]\n\n';
          return results;
        } catch (error) {
          console.error('Search error:', error);
          return `\n\n[SEARCH ERROR: Unable to perform search for "${query}"]\n\n`;
        }
      };

      // If web search is enabled, check if we need to search
      if (webSearchEnabled) {
        try {
          showToast('Checking if search is needed...', 'info');

          const searchCheckResponse = await fetch(
            'https://text.pollinations.ai/openai/chat/completions',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(apiKey && { Authorization: `Bearer ${apiKey}` }),
              },
              body: JSON.stringify({
                model: 'openai-fast',
                messages: [
                  {
                    role: 'system',
                    content:
                      'You determine if a web search is needed to answer the user\'s question. If search is needed, respond with ONLY the search query (no explanation). If no search is needed, respond with "NO_SEARCH".',
                  },
                  ...formattedMessages,
                ],
                stream: false,
              }),
            }
          );

          if (searchCheckResponse.ok) {
            const searchCheckData = await searchCheckResponse.json();
            const searchQuery =
              searchCheckData.choices?.[0]?.message?.content?.trim();

            if (searchQuery && searchQuery !== 'NO_SEARCH') {
              showToast(`Searching for: ${searchQuery}`, 'info');
              const searchResults = await performWebSearch(searchQuery);

              // Add search results as a system message
              formattedMessages.push({
                role: 'system',
                content: searchResults,
              });
            }
          }
        } catch (error) {
          console.error('Search check error:', error);
          // Continue without search if there's an error
        }
      }

      // Add system prompts (mode prompt + custom prompt + web search)
      // Filter based on community model settings if applicable
      const systemPrompts = [];

      // Reasoning mode prompt
      if (
        responseMode === 'reason' &&
        MODE_PROMPTS[responseMode] &&
        (!communityModel || communityModel.allowSystemPrompts.reasoning)
      ) {
        systemPrompts.push({
          role: 'system',
          content: MODE_PROMPTS[responseMode],
        });
      }

      // Rush mode prompt
      if (
        responseMode === 'rush' &&
        MODE_PROMPTS[responseMode] &&
        (!communityModel || communityModel.allowSystemPrompts.rush)
      ) {
        systemPrompts.push({
          role: 'system',
          content: MODE_PROMPTS[responseMode],
        });
      }

      // Custom system prompt
      if (
        customSettings.systemPrompt &&
        (!communityModel || communityModel.allowSystemPrompts.custom)
      ) {
        systemPrompts.push({
          role: 'system',
          content: customSettings.systemPrompt,
        });
      }

      // Web search prompt (always allowed for now)
      if (webSearchEnabled && selectedModel !== 'gemini-search') {
        systemPrompts.push({
          role: 'system',
          content: WEB_SEARCH_PROMPT,
        });
      }

      const messagesWithSystem =
        systemPrompts.length > 0
          ? [...systemPrompts, ...formattedMessages]
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

      // Get endpoint and API key (communityModel already declared above for system prompts)
      const endpoint = communityModel
        ? communityModel.endpoint
        : 'https://text.pollinations.ai/openai/chat/completions';

      // Use community model's API key if available
      if (communityModel) {
        headers['Authorization'] = `Bearer ${communityModel.apiKey}`;
        requestBody.model = communityModel.id;
      }

      // Create abort controller
      abortControllerRef.current = new AbortController();

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
        signal: abortControllerRef.current.signal,
      });

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
      // Check if it was aborted
      if (error instanceof Error && error.name === 'AbortError') {
        showToast('Generation stopped', 'info');
      } else {
        console.error('Error:', error);
        showToast('Failed to send message. Please try again.', 'error');
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: 'Sorry, I encountered an error. Please try again.',
            id: Date.now().toString(),
          },
        ]);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
      // Generate follow-up questions after assistant responds
      if (assistantMessage) {
        generateFollowUpQuestions(assistantMessage);
      }
    }
  };

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
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
            model: 'openai', // Use GPT 4.1 nano for follow-up questions
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

    const imageFiles = Array.from(files).filter((file) =>
      file.type.startsWith('image/')
    );

    if (imageFiles.length === 0) {
      showToast('Please select valid image files', 'error');
      return;
    }

    imageFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setUploadedImages((prev) => [...prev, base64]);
      };
      reader.readAsDataURL(file);
    });

    showToast(
      `${imageFiles.length} image${imageFiles.length > 1 ? 's' : ''} uploaded`,
      'success'
    );
  };

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    showToast('Message copied to clipboard!', 'success');
  };

  const deleteMessage = (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  const startEdit = (id: string, content: string) => {
    setEditingId(id);
    setEditContent(content);
  };

  const saveEdit = async () => {
    if (!editingId) return;

    // Find the edited message
    const editedMessage = messages.find((m) => m.id === editingId);
    if (!editedMessage) return;

    // Update the message
    const updatedMessages = messages.map((m) =>
      m.id === editingId ? { ...m, content: editContent } : m
    );

    // If it's a user message, regenerate the response
    if (editedMessage.role === 'user') {
      // Find the index of the edited message
      const editedIndex = updatedMessages.findIndex((m) => m.id === editingId);

      // Remove all messages after the edited message
      const messagesUpToEdit = updatedMessages.slice(0, editedIndex + 1);
      setMessages(messagesUpToEdit);
      setEditingId(null);
      setEditContent('');

      // Trigger regeneration
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
        const formattedMessages = messagesUpToEdit.map((msg) => {
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

        // Check if this is a community model and get its settings
        const communityModel = communityModels.find(
          (m) => m.id === selectedModel
        );

        // Add system prompts (filter based on community model settings)
        const systemPrompts = [];

        // Reasoning mode prompt
        if (
          responseMode === 'reason' &&
          MODE_PROMPTS[responseMode] &&
          (!communityModel || communityModel.allowSystemPrompts.reasoning)
        ) {
          systemPrompts.push({
            role: 'system',
            content: MODE_PROMPTS[responseMode],
          });
        }

        // Rush mode prompt
        if (
          responseMode === 'rush' &&
          MODE_PROMPTS[responseMode] &&
          (!communityModel || communityModel.allowSystemPrompts.rush)
        ) {
          systemPrompts.push({
            role: 'system',
            content: MODE_PROMPTS[responseMode],
          });
        }

        // Custom system prompt
        if (
          customSettings.systemPrompt &&
          (!communityModel || communityModel.allowSystemPrompts.custom)
        ) {
          systemPrompts.push({
            role: 'system',
            content: customSettings.systemPrompt,
          });
        }

        const messagesWithSystem =
          systemPrompts.length > 0
            ? [...systemPrompts, ...formattedMessages]
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

        // Get endpoint and API key (communityModel already declared above for system prompts)
        const endpoint = communityModel
          ? communityModel.endpoint
          : 'https://text.pollinations.ai/openai/chat/completions';

        // Use community model's API key if available
        if (communityModel) {
          headers['Authorization'] = `Bearer ${communityModel.apiKey}`;
          requestBody.model = communityModel.id;
        }

        const response = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody),
        });

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
        showToast('Failed to regenerate response. Please try again.', 'error');
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
    } else {
      // If it's not a user message, just update it
      setMessages(updatedMessages);
      setEditingId(null);
      setEditContent('');
    }
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

      // Check if this is a community model and get its settings
      const communityModel = communityModels.find(
        (m) => m.id === selectedModel
      );

      // Add system prompts (filter based on community model settings)
      const systemPrompts = [];

      // Reasoning mode prompt
      if (
        responseMode === 'reason' &&
        MODE_PROMPTS[responseMode] &&
        (!communityModel || communityModel.allowSystemPrompts.reasoning)
      ) {
        systemPrompts.push({
          role: 'system',
          content: MODE_PROMPTS[responseMode],
        });
      }

      // Rush mode prompt
      if (
        responseMode === 'rush' &&
        MODE_PROMPTS[responseMode] &&
        (!communityModel || communityModel.allowSystemPrompts.rush)
      ) {
        systemPrompts.push({
          role: 'system',
          content: MODE_PROMPTS[responseMode],
        });
      }

      // Custom system prompt
      if (
        customSettings.systemPrompt &&
        (!communityModel || communityModel.allowSystemPrompts.custom)
      ) {
        systemPrompts.push({
          role: 'system',
          content: customSettings.systemPrompt,
        });
      }

      const messagesWithSystem =
        systemPrompts.length > 0
          ? [...systemPrompts, ...formattedMessages]
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

      // Get endpoint and API key (communityModel already declared above for system prompts)
      const endpoint = communityModel
        ? communityModel.endpoint
        : 'https://text.pollinations.ai/openai/chat/completions';

      // Use community model's API key if available
      if (communityModel) {
        headers['Authorization'] = `Bearer ${communityModel.apiKey}`;
        requestBody.model = communityModel.id;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      });

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

  const generateChatTitle = async (
    messages: Message[]
  ): Promise<string | null> => {
    try {
      const response = await fetch(
        'https://text.pollinations.ai/openai/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(apiKey && { Authorization: `Bearer ${apiKey}` }),
          },
          body: JSON.stringify({
            model: 'openai-fast',
            messages: [
              {
                role: 'system',
                content:
                  'Generate a short, descriptive title (max 50 chars) for this conversation. Respond with ONLY the title, no quotes or explanation.',
              },
              ...messages.slice(0, 4).map((m) => ({
                role: m.role,
                content: m.content,
              })),
            ],
            stream: false,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data.choices?.[0]?.message?.content?.trim() || null;
      }
    } catch (error) {
      console.error('Failed to generate title:', error);
    }
    return null;
  };

  const saveCurrentChat = async () => {
    if (!currentUser || messages.length === 0) return;

    try {
      const title =
        (await generateChatTitle(messages)) || 'Untitled Conversation';

      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          messages,
          username: currentUser,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentChatId(data.chat.id);
        await loadChatList();
        return data.chat.id;
      }
    } catch (error) {
      console.error('Failed to save chat:', error);
    }
    return null;
  };

  const loadChatList = async () => {
    if (!currentUser) return;

    try {
      const response = await fetch(`/api/chats?username=${currentUser}`);
      if (response.ok) {
        const chats = await response.json();
        setChatList(chats);
      }
    } catch (error) {
      console.error('Failed to load chat list:', error);
    }
  };

  const loadChat = async (chatId: string) => {
    try {
      const response = await fetch(`/api/chats/${chatId}`);
      if (response.ok) {
        const chat = await response.json();
        setMessages(chat.messages);
        setCurrentChatId(chat.id);
        setShowChatList(false);
      }
    } catch (error) {
      console.error('Failed to load chat:', error);
    }
  };

  const startNewChat = async () => {
    if (messages.length > 0 && currentUser) {
      await saveCurrentChat();
    }
    setMessages([]);
    setCurrentChatId(null);
    localStorage.removeItem('chat-messages');
    showToast('Started new chat', 'success');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleThumbsUp = (messageId: string) => {
    showToast('Generating follow-up questions...', 'info');
    const message = messages.find((m) => m.id === messageId);
    if (message && message.role === 'assistant') {
      generateFollowUpQuestions(message.content);
    }
  };

  const handleThumbsDown = async (messageId: string) => {
    // Find the message index
    const messageIndex = messages.findIndex((m) => m.id === messageId);
    if (messageIndex === -1) return;

    // Remove the assistant message
    const messagesWithoutLast = messages.slice(0, messageIndex);
    setMessages(messagesWithoutLast);

    // Find the last user message
    const lastUserMessage = [...messagesWithoutLast]
      .reverse()
      .find((m) => m.role === 'user');
    if (!lastUserMessage) return;

    showToast('Regenerating response...', 'info');
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

      // Add system prompts
      const systemPrompts = [];
      if (MODE_PROMPTS[responseMode]) {
        systemPrompts.push({
          role: 'system',
          content: MODE_PROMPTS[responseMode],
        });
      }
      if (customSettings.systemPrompt) {
        systemPrompts.push({
          role: 'system',
          content: customSettings.systemPrompt,
        });
      }
      const messagesWithSystem =
        systemPrompts.length > 0
          ? [...systemPrompts, ...formattedMessages]
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
      showToast('Failed to regenerate response. Please try again.', 'error');
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

  const executeCode = (code: string, language: string, codeId: string) => {
    try {
      if (language === 'html') {
        // For HTML, we'll show it in an iframe
        setCodeOutputs((prev) => ({
          ...prev,
          [codeId]: { output: code },
        }));
        showToast('HTML rendered successfully!', 'success');
      } else if (language === 'python') {
        // For Python, we'll show a message that it's not yet implemented
        setCodeOutputs((prev) => ({
          ...prev,
          [codeId]: {
            output: '',
            error:
              'Python execution coming soon! Install Pyodide library for full Python support.',
          },
        }));
        showToast('Python execution not yet implemented', 'info');
      } else {
        setCodeOutputs((prev) => ({
          ...prev,
          [codeId]: {
            output: '',
            error: `Execution not supported for ${language}`,
          },
        }));
      }
    } catch (error) {
      setCodeOutputs((prev) => ({
        ...prev,
        [codeId]: {
          output: '',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      }));
      showToast('Code execution failed', 'error');
    }
  };

  const generateLiveImage = async () => {
    try {
      // Step 1: Enhance the prompt using GPT 4.1
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      showToast('Enhancing your prompt...', 'info');

      const enhanceResponse = await fetch(
        'https://text.pollinations.ai/openai/chat/completions',
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model: 'openai-fast',
            messages: [
              {
                role: 'system',
                content: `You are an expert at writing image generation prompts. Take the user's idea and enhance it into a detailed, vivid prompt that will generate a beautiful image.

Create a concise but descriptive prompt focusing on visual elements, style, and mood.`,
              },
              {
                role: 'user',
                content: imagePrompt,
              },
            ],
            stream: false,
            temperature: 0.8,
          }),
        }
      );

      if (!enhanceResponse.ok) {
        throw new Error('Failed to enhance prompt');
      }

      const enhanceData = await enhanceResponse.json();
      const finalPrompt =
        enhanceData.choices?.[0]?.message?.content || imagePrompt;
      setEnhancedPrompt(finalPrompt);

      // Step 2: Generate 10 images sequentially with seeds 1-10
      const imageUrls: string[] = [];
      setLiveImageProgress({ current: 0, total: 10 });

      for (let seed = 1; seed <= 10; seed++) {
        setLiveImageProgress({ current: seed, total: 10 });
        showToast(`Generating image ${seed}/10...`, 'info');

        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?seed=${seed}&nologo=true`;

        // Wait for image to load
        await new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            imageUrls.push(imageUrl);
            resolve();
          };
          img.onerror = () => reject(new Error(`Failed to load image ${seed}`));
          img.src = imageUrl;
        });
      }

      // Step 3: Create GIF from images
      showToast('Creating GIF...', 'info');

      // For now, we'll create a simple animated display
      // In a production app, you'd use gif.js or a service to create an actual GIF
      // For this implementation, we'll store the URLs and animate them
      setGeneratedGifUrl(imageUrls.join('|')); // Store URLs separated by |
      setLiveImageProgress(null);
      setIsGeneratingImage(false);
      showToast('Live image generated successfully!', 'success');
    } catch (error) {
      console.error('Error generating live image:', error);
      setIsGeneratingImage(false);
      setLiveImageProgress(null);
      showToast('Failed to generate live image. Please try again.', 'error');
    }
  };

  const generateImage = async () => {
    if (!imagePrompt.trim()) return;

    setIsGeneratingImage(true);
    setGeneratedImageUrl(null);
    setGeneratedGifUrl(null);

    // If live image mode, generate 10 images sequentially
    if (liveImage) {
      await generateLiveImage();
      return;
    }

    try {
      // Step 1: Enhance the prompt using GPT 4.1 nano
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      showToast('Enhancing your prompt...', 'info');

      // Build the user message with optional image
      const userMessage: { role: string; content: string | unknown[] } = {
        role: 'user',
        content: imagePrompt,
      };

      // If there's a reference image, format as vision message
      if (referenceImage) {
        userMessage.content = [
          {
            type: 'text',
            text: imagePrompt,
          },
          {
            type: 'image_url',
            image_url: {
              url: referenceImage,
            },
          },
        ];
      }

      const enhanceResponse = await fetch(
        'https://text.pollinations.ai/openai/chat/completions',
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model: 'openai-fast',
            messages: [
              {
                role: 'system',
                content: referenceImage
                  ? `You are an expert at writing image generation prompts. The user has provided a reference image and wants to generate a new image based on it.

Your task: Analyze the reference image and create an enhanced prompt that preserves key aspects while incorporating the user's requested changes.

Use <think></think> tags for your reasoning:

<think>
Reference image analysis: [colors, composition, style, lighting, mood, objects]
User's request: [what they want to change]
Preserve: [specific aspects to keep]
Transform: [what to change and how]
Final synthesis: [balanced prompt combining both]
</think>

[Your final enhanced prompt - detailed, vivid, and specific]

**Critical:**
- NO meta-commentary ("I see the user wants...")
- NO narrative self-talk ("Let me analyze...")
- Start reasoning immediately with substantive observations
- Focus on visual elements, not the process`
                  : `You are an expert at writing image generation prompts. Take the user's idea and enhance it into a detailed, vivid prompt that will generate a beautiful image.

Use <think></think> tags for your reasoning:

<think>
User's idea: [what they want]
Key elements: [main subjects, objects, characters]
Style considerations: [artistic style, medium, technique]
Mood and atmosphere: [emotional tone, lighting, colors]
Composition: [layout, perspective, framing]
Final synthesis: [how to combine all elements]
</think>

[Your final enhanced prompt - detailed, vivid, and specific]

**Critical:**
- NO meta-commentary ("I see the user wants...")
- NO narrative self-talk ("Let me think...")
- Start reasoning immediately with substantive analysis
- Be descriptive about style, lighting, composition, and mood`,
              },
              userMessage,
            ],
            stream: false,
            temperature: 0.8,
          }),
        }
      );

      if (!enhanceResponse.ok) {
        throw new Error('Failed to enhance prompt');
      }

      const enhanceData = await enhanceResponse.json();
      const rawResponse =
        enhanceData.choices?.[0]?.message?.content || imagePrompt;

      // Extract the final prompt and reasoning separately
      let finalPrompt = rawResponse;
      let reasoning = '';
      const thinkMatch = rawResponse.match(
        /<think>([\s\S]*?)<\/think>\s*([\s\S]*)/
      );
      if (thinkMatch) {
        reasoning = thinkMatch[1].trim();
        finalPrompt = thinkMatch[2].trim();
      }

      // Store reasoning and final prompt separately
      setImageReasoning(reasoning);
      setEnhancedPrompt(finalPrompt);
      setShowPrompt(false);
      setShowReasoning(false);

      showToast('Generating image...', 'info');

      // Step 2: Generate the image using only the final prompt
      let imageUrl: string;

      // Use Kontext model if user has API key and reference image
      if (apiKey && referenceImage) {
        imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?model=kontext&image=${encodeURIComponent(referenceImage)}&token=${encodeURIComponent(apiKey)}&nologo=true`;
      } else {
        imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?nologo=true`;
      }

      // Preload the image to show loading state
      const img = new Image();
      img.onload = () => {
        setGeneratedImageUrl(imageUrl);
        setIsGeneratingImage(false);
        showToast('Image generated successfully!', 'success');
      };
      img.onerror = () => {
        setIsGeneratingImage(false);
        showToast('Failed to generate image', 'error');
      };
      img.src = imageUrl;
    } catch (error) {
      console.error('Error generating image:', error);
      setIsGeneratingImage(false);
      showToast('Failed to generate image. Please try again.', 'error');
    }
  };

  const formatMessage = (content: string, messageId: string) => {
    // Check for incomplete <think> tag (streaming in progress)
    const hasOpenThink = content.includes('<think>');
    const hasCloseThink = content.includes('</think>');
    const isThinking = hasOpenThink && !hasCloseThink;

    // Track thinking timestamps
    if (hasOpenThink && !thinkingTimestamps[messageId]) {
      setThinkingTimestamps((prev) => ({
        ...prev,
        [messageId]: { start: Date.now() },
      }));
    } else if (
      hasCloseThink &&
      thinkingTimestamps[messageId] &&
      !thinkingTimestamps[messageId].end
    ) {
      setThinkingTimestamps((prev) => ({
        ...prev,
        [messageId]: { ...prev[messageId], end: Date.now() },
      }));
    }

    // If still thinking, show partial content
    if (isThinking) {
      const thinkContent = content.split('<think>')[1] || '';
      const thinkId = `${messageId}-think-partial`;
      const isExpanded = expandedThinking[thinkId] || false; // Default to collapsed

      return (
        <div
          style={{
            margin: '12px 0',
            border: `1px solid ${currentTheme.border}`,
            borderRadius: '8px',
            overflow: 'hidden',
          }}
        >
          <button
            onClick={() =>
              setExpandedThinking((prev) => ({
                ...prev,
                [thinkId]: !prev[thinkId],
              }))
            }
            style={{
              width: '100%',
              padding: '8px 12px',
              background: 'rgba(0, 0, 0, 0.05)',
              border: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '13px',
              color: currentTheme.text,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Loader2
              size={14}
              style={{ animation: 'spin 1s linear infinite' }}
            />
            {isExpanded ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
            )}
            <Brain size={14} />
            <span style={{ fontWeight: 500 }}>Thinking...</span>
          </button>
          {isExpanded && (
            <div
              style={{
                padding: '12px',
                background: 'rgba(0, 0, 0, 0.02)',
                fontSize: '13px',
                whiteSpace: 'pre-wrap',
                color: currentTheme.text,
                opacity: 0.8,
              }}
            >
              {thinkContent}
            </div>
          )}
        </div>
      );
    }

    // Extract <think> tags
    const thinkRegex = /<think>([\s\S]*?)<\/think>/g;
    const parts: Array<{ type: 'text' | 'think'; content: string }> = [];
    let lastIndex = 0;
    let match;

    while ((match = thinkRegex.exec(content)) !== null) {
      // Add text before <think>
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: content.slice(lastIndex, match.index),
        });
      }
      // Add <think> content
      parts.push({ type: 'think', content: match[1] });
      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push({ type: 'text', content: content.slice(lastIndex) });
    }

    return (
      <>
        {parts.map((part, i) => {
          if (part.type === 'think') {
            const thinkId = `${messageId}-think-${i}`;
            const isExpanded = expandedThinking[thinkId] || false;

            // Calculate duration
            const timestamps = thinkingTimestamps[messageId];
            const duration = timestamps?.end
              ? ((timestamps.end - timestamps.start) / 1000).toFixed(1)
              : null;

            return (
              <div
                key={i}
                style={{
                  margin: '12px 0',
                  border: `1px solid ${currentTheme.border}`,
                  borderRadius: '8px',
                  overflow: 'hidden',
                }}
              >
                <button
                  onClick={() =>
                    setExpandedThinking((prev) => ({
                      ...prev,
                      [thinkId]: !prev[thinkId],
                    }))
                  }
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'rgba(0, 0, 0, 0.05)',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '13px',
                    color: currentTheme.text,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  {isExpanded ? (
                    <ChevronDown size={14} />
                  ) : (
                    <ChevronRight size={14} />
                  )}
                  <Brain size={14} />
                  <span style={{ fontWeight: 500 }}>
                    {duration
                      ? `Thought for ${duration} seconds`
                      : 'Chain of Thought'}
                  </span>
                </button>
                {isExpanded && (
                  <div
                    style={{
                      padding: '12px',
                      background: 'rgba(0, 0, 0, 0.02)',
                      fontSize: '13px',
                      whiteSpace: 'pre-wrap',
                      color: currentTheme.text,
                      opacity: 0.8,
                    }}
                    dangerouslySetInnerHTML={{
                      __html: marked(escapeCitations(part.content)) as string,
                    }}
                  />
                )}
              </div>
            );
          } else {
            // Parse markdown for regular text
            const htmlContent = marked(escapeCitations(part.content)) as string;

            // Extract code blocks and add run buttons
            const codeBlockRegex =
              /<pre><code class="language-(\w+)">([\s\S]*?)<\/code><\/pre>/g;
            const segments: Array<{
              type: 'html' | 'code';
              content: string;
              language?: string;
            }> = [];
            let lastIdx = 0;
            let codeMatch;

            while ((codeMatch = codeBlockRegex.exec(htmlContent)) !== null) {
              // Add HTML before code block
              if (codeMatch.index > lastIdx) {
                segments.push({
                  type: 'html',
                  content: htmlContent.slice(lastIdx, codeMatch.index),
                });
              }
              // Add code block
              segments.push({
                type: 'code',
                content: codeMatch[2]
                  .replace(/&lt;/g, '<')
                  .replace(/&gt;/g, '>')
                  .replace(/&amp;/g, '&')
                  .replace(/&quot;/g, '"')
                  .replace(/&#39;/g, "'"),
                language: codeMatch[1],
              });
              lastIdx = codeMatch.index + codeMatch[0].length;
            }

            // Add remaining HTML
            if (lastIdx < htmlContent.length) {
              segments.push({
                type: 'html',
                content: htmlContent.slice(lastIdx),
              });
            }

            // If no code blocks, just render the HTML
            if (segments.length === 0) {
              return (
                <div
                  key={i}
                  dangerouslySetInnerHTML={{ __html: htmlContent }}
                  style={{
                    fontSize: '14px',
                    lineHeight: '1.6',
                  }}
                />
              );
            }

            // Render segments with code execution buttons
            return (
              <div key={i} style={{ fontSize: '14px', lineHeight: '1.6' }}>
                {segments.map((segment, segIdx) => {
                  if (segment.type === 'html') {
                    return (
                      <div
                        key={segIdx}
                        dangerouslySetInnerHTML={{ __html: segment.content }}
                      />
                    );
                  } else {
                    const codeId = `${messageId}-code-${i}-${segIdx}`;
                    const output = codeOutputs[codeId];
                    const isExecutable =
                      segment.language === 'html' ||
                      segment.language === 'python';

                    return (
                      <div key={segIdx} style={{ margin: '12px 0' }}>
                        <div
                          style={{
                            background: 'rgba(0, 0, 0, 0.05)',
                            borderRadius: '8px 8px 0 0',
                            padding: '8px 12px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderBottom: `1px solid ${currentTheme.border}`,
                          }}
                        >
                          <span
                            style={{
                              fontSize: '12px',
                              color: currentTheme.text,
                              opacity: 0.7,
                            }}
                          >
                            {segment.language}
                          </span>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(
                                  segment.content || ''
                                );
                                showToast(
                                  'Code copied to clipboard!',
                                  'success'
                                );
                              }}
                              style={{
                                padding: '4px 12px',
                                borderRadius: '4px',
                                border: `1px solid ${currentTheme.border}`,
                                background: currentTheme.messageBg,
                                color: currentTheme.text,
                                fontSize: '11px',
                                cursor: 'pointer',
                                fontWeight: 500,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <Copy size={12} />
                              Copy
                            </button>
                            {isExecutable && (
                              <button
                                onClick={() =>
                                  executeCode(
                                    segment.content || '',
                                    segment.language || '',
                                    codeId
                                  )
                                }
                                style={{
                                  padding: '4px 12px',
                                  borderRadius: '4px',
                                  border: 'none',
                                  background: '#10b981',
                                  color: 'white',
                                  fontSize: '11px',
                                  cursor: 'pointer',
                                  fontWeight: 500,
                                }}
                              >
                                ▶ Run Code
                              </button>
                            )}
                          </div>
                        </div>
                        <pre
                          style={{
                            margin: 0,
                            background: '#0d1117',
                            padding: '12px',
                            borderRadius: '0 0 8px 8px',
                            overflow: 'auto',
                          }}
                        >
                          <code
                            className={`language-${segment.language}`}
                            style={{
                              fontSize: '13px',
                              fontFamily: 'monospace',
                            }}
                            dangerouslySetInnerHTML={{
                              __html: segment.language
                                ? hljs.highlight(segment.content || '', {
                                    language: segment.language,
                                    ignoreIllegals: true,
                                  }).value
                                : segment.content || '',
                            }}
                          />
                        </pre>
                        {output && (
                          <div
                            style={{
                              marginTop: '8px',
                              padding: '12px',
                              background: output.error
                                ? 'rgba(239, 68, 68, 0.1)'
                                : 'rgba(16, 185, 129, 0.1)',
                              borderRadius: '8px',
                              border: `1px solid ${output.error ? '#ef4444' : '#10b981'}`,
                            }}
                          >
                            <div
                              style={{
                                fontSize: '12px',
                                fontWeight: 500,
                                marginBottom: '8px',
                                color: output.error ? '#ef4444' : '#10b981',
                              }}
                            >
                              {output.error ? '❌ Error' : '✓ Output'}
                            </div>
                            {output.error ? (
                              <div
                                style={{ fontSize: '13px', color: '#ef4444' }}
                              >
                                {output.error}
                              </div>
                            ) : segment.language === 'html' ? (
                              <iframe
                                srcDoc={output.output}
                                style={{
                                  width: '100%',
                                  minHeight: '200px',
                                  border: 'none',
                                  borderRadius: '4px',
                                  background: 'white',
                                }}
                                sandbox="allow-scripts"
                              />
                            ) : (
                              <pre
                                style={{
                                  margin: 0,
                                  fontSize: '13px',
                                  whiteSpace: 'pre-wrap',
                                }}
                              >
                                {output.output}
                              </pre>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  }
                })}
              </div>
            );
          }
        })}
      </>
    );
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background: currentTheme.bg,
        fontFamily:
          'fontFamily' in currentTheme
            ? (currentTheme as { fontFamily: string }).fontFamily
            : 'inherit',
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
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Bot size={24} />
            AI Chat Enhanced
          </h1>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setShowImageGenerator(!showImageGenerator)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                background: showImageGenerator
                  ? 'rgba(102, 126, 234, 0.8)'
                  : 'rgba(107, 114, 128, 0.8)',
                color: 'white',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <ImageIcon
                size={14}
                style={{ marginRight: '4px', color: currentTheme.iconAccent }}
              />
              Generate Image
            </button>
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
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Settings
                size={14}
                style={{ marginRight: '4px', color: currentTheme.iconPrimary }}
              />
              Settings
            </button>
            {chatList.length > 0 && (
              <button
                onClick={() => setShowChatList(!showChatList)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'rgba(102, 126, 234, 0.8)',
                  color: 'white',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  marginRight: '8px',
                }}
              >
                📜 History ({chatList.length})
              </button>
            )}
            <button
              onClick={startNewChat}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                background: 'rgba(16, 185, 129, 0.8)',
                color: 'white',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              ➕ New Chat
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
                {model.vision ? ' [Vision]' : ''}
                {model.audio ? ' [Audio]' : ''}
                {model.reasoning ? ' [Reasoning]' : ''}
                {model.tier === 'seed' ? ' [API Key Required]' : ''}
              </option>
            ))}
            {communityModels.map((model) => (
              <option
                key={model.id}
                value={model.id}
                style={{ color: 'black' }}
              >
                {model.name} (Community)
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowApiKeyInput(!showApiKeyInput)}
            title={apiKey ? 'API Key Set' : 'Set API Key'}
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
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Key size={14} />
            {apiKey ? '✓' : 'API Key'}
          </button>
          <button
            onClick={() => {
              setShowAddModel(true);
              setEditingModelId(null);
            }}
            title="Add Community Model"
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: `1px solid ${currentTheme.border}`,
              background: currentTheme.messageBg,
              color: currentTheme.text,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            ➕ Model
          </button>
          {communityModels.length > 0 && (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => {
                  const selectedCommunity = communityModels.find(
                    (m) => m.id === selectedModel
                  );
                  if (selectedCommunity) {
                    setNewModelId(selectedCommunity.id);
                    setNewModelName(selectedCommunity.name);
                    setNewModelEndpoint(selectedCommunity.endpoint);
                    setNewModelApiKey(selectedCommunity.apiKey);
                    setNewModelAllowSystemPrompts(
                      selectedCommunity.allowSystemPrompts
                    );
                    setEditingModelId(selectedCommunity.id);
                    setShowAddModel(true);
                  }
                }}
                disabled={!communityModels.find((m) => m.id === selectedModel)}
                title="Edit Selected Community Model"
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: `1px solid ${currentTheme.border}`,
                  background: communityModels.find(
                    (m) => m.id === selectedModel
                  )
                    ? currentTheme.messageBg
                    : 'rgba(128, 128, 128, 0.2)',
                  color: currentTheme.text,
                  fontSize: '14px',
                  cursor: communityModels.find((m) => m.id === selectedModel)
                    ? 'pointer'
                    : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  opacity: communityModels.find((m) => m.id === selectedModel)
                    ? 1
                    : 0.5,
                }}
              >
                ✏️ Edit
              </button>
            </div>
          )}
          {communityModels.length > 0 && (
            <button
              onClick={() => {
                const selectedCommunity = communityModels.find(
                  (m) => m.id === selectedModel
                );
                if (
                  selectedCommunity &&
                  confirm(`Delete community model "${selectedCommunity.name}"?`)
                ) {
                  setCommunityModels(
                    communityModels.filter((m) => m.id !== selectedModel)
                  );
                  setSelectedModel('openai');
                  showToast('Community model deleted', 'info');
                }
              }}
              disabled={!communityModels.find((m) => m.id === selectedModel)}
              title="Delete Selected Community Model"
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: `1px solid ${currentTheme.border}`,
                background: communityModels.find((m) => m.id === selectedModel)
                  ? 'rgba(239, 68, 68, 0.2)'
                  : 'rgba(128, 128, 128, 0.2)',
                color: communityModels.find((m) => m.id === selectedModel)
                  ? '#ef4444'
                  : currentTheme.text,
                fontSize: '14px',
                cursor: communityModels.find((m) => m.id === selectedModel)
                  ? 'pointer'
                  : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                opacity: communityModels.find((m) => m.id === selectedModel)
                  ? 1
                  : 0.5,
              }}
            >
              🗑️ Delete
            </button>
          )}
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
              Light
            </option>
            <option value="dark" style={{ color: 'black' }}>
              Dark
            </option>
            <option value="purple" style={{ color: 'black' }}>
              Purple
            </option>
            <option value="ocean" style={{ color: 'black' }}>
              Ocean
            </option>
            <option value="forest" style={{ color: 'black' }}>
              Forest
            </option>
            <option value="openwebui" style={{ color: 'black' }}>
              OpenWebUI
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
                onChange={(e) => {
                  const newKey = e.target.value;
                  setApiKey(newKey);
                  if (newKey.length > 0 && apiKey.length === 0) {
                    showToast('API key set successfully!', 'success');
                  }
                }}
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
                onClick={() => {
                  setApiKey('');
                  showToast('API key cleared', 'info');
                }}
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

              {/* Personality Templates */}
              <div
                style={{
                  display: 'flex',
                  gap: '6px',
                  marginBottom: '8px',
                  flexWrap: 'wrap',
                }}
              >
                {[
                  {
                    name: 'Friendly',
                    prompt:
                      'You are a friendly and warm assistant. Be encouraging, use casual language, and show enthusiasm in your responses.',
                  },
                  {
                    name: 'Professional',
                    prompt:
                      'You are a professional assistant. Be formal, precise, and maintain a business-like tone in all responses.',
                  },
                  {
                    name: 'Sardonic',
                    prompt:
                      'You are a sardonic assistant with a dry wit. Use subtle humor and irony, but remain helpful and informative.',
                  },
                  {
                    name: 'Concise',
                    prompt:
                      'You are a concise assistant. Give brief, to-the-point answers without unnecessary elaboration.',
                  },
                  {
                    name: 'Teacher',
                    prompt:
                      'You are a patient teacher. Explain concepts clearly, use examples, and encourage learning through questions.',
                  },
                ].map((template) => (
                  <button
                    key={template.name}
                    onClick={() =>
                      setCustomSettings((prev) => ({
                        ...prev,
                        systemPrompt: template.prompt,
                      }))
                    }
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: `1px solid ${currentTheme.border}`,
                      background:
                        customSettings.systemPrompt === template.prompt
                          ? 'rgba(102, 126, 234, 0.3)'
                          : currentTheme.messageBg,
                      color: currentTheme.text,
                      fontSize: '11px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    {template.name}
                  </button>
                ))}
              </div>

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

            {/* Web Search Toggle */}
            <div style={{ marginBottom: '12px' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12px',
                  color: currentTheme.text,
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={webSearchEnabled}
                  onChange={(e) => setWebSearchEnabled(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                🔍 Enable Web Search (Experimental)
              </label>
              <div
                style={{
                  fontSize: '10px',
                  color: currentTheme.text,
                  opacity: 0.6,
                  marginTop: '4px',
                  marginLeft: '24px',
                }}
              >
                AI can search the web using DuckDuckGo and cite sources
              </div>
            </div>

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

        {/* Image Generator Modal */}
        {showImageGenerator && (
          <div
            style={{
              marginTop: '10px',
              padding: '20px',
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
              🎨 AI Image Generator
            </div>
            <div
              style={{
                marginBottom: '12px',
                fontSize: '12px',
                color: currentTheme.text,
                opacity: 0.8,
              }}
            >
              Describe your image idea and AI will enhance it and generate a
              beautiful image for you. Optionally upload a reference image for
              image-to-image generation.
            </div>
            {/* Reference Image Upload */}
            <div style={{ marginBottom: '12px' }}>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const result = event.target?.result;
                      if (result && typeof result === 'string') {
                        setReferenceImage(result);
                      }
                    };
                    reader.onerror = () => {
                      showToast('Failed to read image file', 'error');
                    };
                    reader.readAsDataURL(file);
                  }
                  // Reset the input so the same file can be selected again
                  e.target.value = '';
                }}
                style={{ display: 'none' }}
                id="reference-image-upload"
                key={referenceImage || 'no-image'}
              />
              <label
                htmlFor="reference-image-upload"
                style={{
                  display: 'inline-block',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: `1px solid ${currentTheme.border}`,
                  background: currentTheme.messageBg,
                  color: currentTheme.text,
                  fontSize: '12px',
                  cursor: 'pointer',
                  marginBottom: referenceImage ? '8px' : '0',
                }}
              >
                📷 {referenceImage ? 'Change' : 'Upload'} Reference Image
              </label>
              {referenceImage && (
                <div
                  style={{
                    position: 'relative',
                    display: 'inline-block',
                    marginLeft: '8px',
                  }}
                >
                  <img
                    src={referenceImage}
                    alt="Reference"
                    style={{
                      width: '60px',
                      height: '60px',
                      objectFit: 'cover',
                      borderRadius: '6px',
                      border: `2px solid ${currentTheme.border}`,
                    }}
                  />
                  <button
                    onClick={() => setReferenceImage(null)}
                    style={{
                      position: 'absolute',
                      top: '-6px',
                      right: '-6px',
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: 'none',
                      background: '#ef4444',
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
              )}
            </div>
            <textarea
              value={imagePrompt}
              onChange={(e) => setImagePrompt(e.target.value)}
              placeholder="e.g., A serene mountain landscape at sunset..."
              disabled={isGeneratingImage}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '6px',
                border: `1px solid ${currentTheme.border}`,
                background: currentTheme.messageBg,
                color: currentTheme.text,
                fontSize: '13px',
                minHeight: '80px',
                resize: 'vertical',
                marginBottom: '12px',
              }}
            />
            {/* Live Image Toggle */}
            <div
              style={{
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <input
                type="checkbox"
                id="live-image-toggle"
                checked={liveImage}
                onChange={(e) => setLiveImage(e.target.checked)}
                disabled={isGeneratingImage}
                style={{ cursor: 'pointer' }}
              />
              <label
                htmlFor="live-image-toggle"
                style={{
                  fontSize: '13px',
                  color: currentTheme.text,
                  cursor: 'pointer',
                }}
              >
                🎬 Live Image (generates 10 frames as GIF)
              </label>
            </div>
            {/* Progress Indicator */}
            {liveImageProgress && (
              <div
                style={{
                  marginBottom: '12px',
                  padding: '8px 12px',
                  background: 'rgba(102, 126, 234, 0.1)',
                  borderRadius: '6px',
                  fontSize: '13px',
                  color: currentTheme.text,
                }}
              >
                Generating frame {liveImageProgress.current}/
                {liveImageProgress.total}...
              </div>
            )}
            <button
              onClick={generateImage}
              disabled={isGeneratingImage || !imagePrompt.trim()}
              style={{
                padding: '10px 20px',
                borderRadius: '6px',
                border: 'none',
                background:
                  isGeneratingImage || !imagePrompt.trim()
                    ? 'rgba(107, 114, 128, 0.5)'
                    : '#667eea',
                color: 'white',
                fontSize: '13px',
                cursor:
                  isGeneratingImage || !imagePrompt.trim()
                    ? 'not-allowed'
                    : 'pointer',
                fontWeight: 600,
                width: '100%',
              }}
            >
              {isGeneratingImage ? '🎨 Generating...' : '✨ Generate Image'}
            </button>
            {isGeneratingImage && (
              <div
                style={{
                  marginTop: '16px',
                  padding: '20px',
                  background: currentTheme.messageBg,
                  borderRadius: '8px',
                  textAlign: 'center',
                }}
              >
                <Loader2
                  size={32}
                  style={{
                    animation: 'spin 1s linear infinite',
                    color: currentTheme.iconPrimary,
                  }}
                />
                <div
                  style={{
                    marginTop: '12px',
                    fontSize: '13px',
                    color: currentTheme.text,
                  }}
                >
                  Creating your masterpiece...
                </div>
              </div>
            )}
            {(generatedImageUrl || generatedGifUrl) && !isGeneratingImage && (
              <div
                style={{
                  marginTop: '16px',
                  padding: '12px',
                  background: currentTheme.messageBg,
                  borderRadius: '8px',
                }}
              >
                {generatedGifUrl ? (
                  <LiveImageDisplay imageUrls={generatedGifUrl.split('|')} />
                ) : (
                  <img
                    src={generatedImageUrl!}
                    alt="Generated"
                    style={{
                      width: '100%',
                      borderRadius: '8px',
                      display: 'block',
                    }}
                  />
                )}
                <div
                  style={{
                    marginTop: '12px',
                    display: 'flex',
                    gap: '8px',
                  }}
                >
                  {imageReasoning && (
                    <button
                      onClick={() => setShowReasoning(!showReasoning)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: '6px',
                        border: 'none',
                        background: '#8b5cf6',
                        color: 'white',
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      🧠 {showReasoning ? 'Hide' : 'Show'} Reasoning
                    </button>
                  )}
                  <button
                    onClick={() => setShowPrompt(!showPrompt)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '6px',
                      border: 'none',
                      background: '#667eea',
                      color: 'white',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    📝 {showPrompt ? 'Hide' : 'Show'} Prompt
                  </button>
                  <button
                    onClick={() => {
                      if (!generatedImageUrl) return;
                      const link = document.createElement('a');
                      link.href = generatedImageUrl;
                      link.download = 'generated-image.png';
                      link.click();
                    }}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '6px',
                      border: 'none',
                      background: '#10b981',
                      color: 'white',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    💾 Download
                  </button>
                  <button
                    onClick={async () => {
                      if (!currentUser) {
                        alert('Please log in to share images');
                        return;
                      }

                      try {
                        const response = await fetch('/api/images', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            prompt: enhancedPrompt || imagePrompt,
                            creator: currentUser,
                          }),
                        });

                        if (response.ok) {
                          showToast('Image shared to feed!', 'success');
                        } else {
                          throw new Error('Failed to share image');
                        }
                      } catch {
                        showToast('Failed to share image', 'error');
                      }
                    }}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '6px',
                      border: 'none',
                      background: '#f59e0b',
                      color: 'white',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    📤 Share
                  </button>
                  <button
                    onClick={() => {
                      setGeneratedImageUrl(null);
                      setImagePrompt('');
                      setEnhancedPrompt('');
                      setImageReasoning('');
                      setShowPrompt(false);
                      setShowReasoning(false);
                      setReferenceImage(null);
                    }}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '6px',
                      border: 'none',
                      background: 'rgba(107, 114, 128, 0.8)',
                      color: 'white',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    🔄 New Image
                  </button>
                </div>
                {showReasoning && imageReasoning && (
                  <div
                    style={{
                      marginTop: '12px',
                      padding: '12px',
                      background: 'rgba(139, 92, 246, 0.1)',
                      borderRadius: '6px',
                      fontSize: '13px',
                      color: currentTheme.text,
                      lineHeight: '1.6',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 600,
                        marginBottom: '8px',
                        fontSize: '12px',
                        opacity: 0.8,
                      }}
                    >
                      🧠 AI Reasoning Process:
                    </div>
                    {imageReasoning}
                  </div>
                )}
                {showPrompt && enhancedPrompt && (
                  <div
                    style={{
                      marginTop: '12px',
                      padding: '12px',
                      background: 'rgba(0, 0, 0, 0.05)',
                      borderRadius: '6px',
                      fontSize: '13px',
                      color: currentTheme.text,
                      lineHeight: '1.6',
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 600,
                        marginBottom: '8px',
                        fontSize: '12px',
                        opacity: 0.8,
                      }}
                    >
                      📝 Enhanced Prompt:
                    </div>
                    {enhancedPrompt}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Add Community Model Modal */}
        {showAddModel && (
          <div
            onClick={() => setShowAddModel(false)}
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
                ➕ Add Community Model
              </h2>

              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: '#1f2937',
                    marginBottom: '8px',
                  }}
                >
                  Model ID
                </label>
                <input
                  type="text"
                  value={newModelId}
                  onChange={(e) => setNewModelId(e.target.value)}
                  placeholder="e.g., gpt-4"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '10px',
                    border: '2px solid #e5e7eb',
                    fontSize: '16px',
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: '#1f2937',
                    marginBottom: '8px',
                  }}
                >
                  Display Name
                </label>
                <input
                  type="text"
                  value={newModelName}
                  onChange={(e) => setNewModelName(e.target.value)}
                  placeholder="e.g., GPT-4"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '10px',
                    border: '2px solid #e5e7eb',
                    fontSize: '16px',
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: '#1f2937',
                    marginBottom: '8px',
                  }}
                >
                  API Endpoint
                </label>
                <input
                  type="text"
                  value={newModelEndpoint}
                  onChange={(e) => setNewModelEndpoint(e.target.value)}
                  placeholder="https://api.example.com/v1/chat/completions"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '10px',
                    border: '2px solid #e5e7eb',
                    fontSize: '16px',
                  }}
                />
              </div>

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
                  API Key
                </label>
                <input
                  type="password"
                  value={newModelApiKey}
                  onChange={(e) => setNewModelApiKey(e.target.value)}
                  placeholder="Your API key"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '10px',
                    border: '2px solid #e5e7eb',
                    fontSize: '16px',
                  }}
                />
              </div>

              {/* System Prompt Settings */}
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
                  Allow System Prompts
                </label>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  {[
                    { key: 'reasoning', label: 'Reasoning Mode' },
                    { key: 'rush', label: 'Rush Mode' },
                    { key: 'personality', label: 'Personality Templates' },
                    { key: 'custom', label: 'Custom System Prompt' },
                  ].map(({ key, label }) => (
                    <label
                      key={key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={
                          newModelAllowSystemPrompts[
                            key as keyof typeof newModelAllowSystemPrompts
                          ]
                        }
                        onChange={(e) =>
                          setNewModelAllowSystemPrompts({
                            ...newModelAllowSystemPrompts,
                            [key]: e.target.checked,
                          })
                        }
                        style={{ cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '14px', color: '#1f2937' }}>
                        {label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => {
                    if (
                      !newModelId ||
                      !newModelName ||
                      !newModelEndpoint ||
                      !newModelApiKey
                    ) {
                      alert('Please fill in all fields');
                      return;
                    }

                    if (!currentUser) {
                      alert('Please log in to create community models');
                      return;
                    }

                    if (editingModelId) {
                      // Update existing model
                      setCommunityModels(
                        communityModels.map((m) =>
                          m.id === editingModelId
                            ? {
                                id: newModelId,
                                name: newModelName,
                                endpoint: newModelEndpoint,
                                apiKey: newModelApiKey,
                                creator: m.creator, // Keep original creator
                                allowSystemPrompts: newModelAllowSystemPrompts,
                              }
                            : m
                        )
                      );
                      showToast('Community model updated!', 'success');
                    } else {
                      // Add new model
                      setCommunityModels([
                        ...communityModels,
                        {
                          id: newModelId,
                          name: newModelName,
                          endpoint: newModelEndpoint,
                          apiKey: newModelApiKey,
                          creator: currentUser,
                          allowSystemPrompts: newModelAllowSystemPrompts,
                        },
                      ]);
                      showToast('Community model added!', 'success');
                    }

                    setNewModelId('');
                    setNewModelName('');
                    setNewModelEndpoint('');
                    setNewModelApiKey('');
                    setNewModelAllowSystemPrompts({
                      reasoning: true,
                      rush: true,
                      personality: true,
                      custom: true,
                    });
                    setEditingModelId(null);
                    setShowAddModel(false);
                  }}
                  style={{
                    flex: 1,
                    padding: '15px',
                    borderRadius: '10px',
                    border: 'none',
                    background:
                      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    cursor: 'pointer',
                  }}
                >
                  {editingModelId ? 'Update Model' : 'Add Model'}
                </button>
                <button
                  onClick={() => {
                    setShowAddModel(false);
                    setEditingModelId(null);
                    setNewModelId('');
                    setNewModelName('');
                    setNewModelEndpoint('');
                    setNewModelApiKey('');
                    setNewModelAllowSystemPrompts({
                      reasoning: true,
                      rush: true,
                      personality: true,
                      custom: true,
                    });
                  }}
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
      </div>

      {/* Chat History Modal */}
      {showChatList && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowChatList(false)}
        >
          <div
            style={{
              background: currentTheme.messageBg,
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
              }}
            >
              <h2 style={{ color: currentTheme.text, margin: 0 }}>
                Chat History
              </h2>
              <button
                onClick={() => setShowChatList(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: currentTheme.text,
                }}
              >
                ×
              </button>
            </div>
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              {chatList.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => loadChat(chat.id)}
                  style={{
                    padding: '16px',
                    background: currentTheme.assistantBg,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    border: `1px solid ${currentTheme.border}`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = currentTheme.userBg;
                    e.currentTarget.style.color = currentTheme.userText;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = currentTheme.assistantBg;
                    e.currentTarget.style.color = currentTheme.text;
                  }}
                >
                  <div
                    style={{
                      fontWeight: '500',
                      marginBottom: '4px',
                      color: 'inherit',
                    }}
                  >
                    {chat.title}
                  </div>
                  <div style={{ fontSize: '12px', opacity: 0.7 }}>
                    {new Date(chat.updatedAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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
                    padding: theme === 'openwebui' ? '16px 20px' : '12px 16px',
                    borderRadius:
                      theme === 'openwebui'
                        ? message.role === 'user'
                          ? '18px 18px 4px 18px'
                          : '18px 18px 18px 4px'
                        : '12px',
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
                      theme === 'openwebui'
                        ? `1px solid ${currentTheme.border}`
                        : message.role === 'user'
                          ? '2px solid rgba(102, 126, 234, 0.5)'
                          : 'none',
                    boxShadow:
                      theme === 'openwebui'
                        ? '0 1px 2px rgba(0, 0, 0, 0.05)'
                        : message.role === 'user'
                          ? '0 2px 8px rgba(0, 0, 0, 0.15)'
                          : 'none',
                  }}
                >
                  {formatMessage(message.content, message.id)}
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
                    <Copy size={14} />
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
                      <Edit3 size={14} />
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
                    <Trash2 size={14} />
                  </button>
                  {message.role === 'assistant' && (
                    <>
                      <button
                        onClick={() => handleThumbsUp(message.id)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          border: 'none',
                          background: 'transparent',
                          color: currentTheme.text,
                          fontSize: '11px',
                          cursor: 'pointer',
                        }}
                        title="Good response - Generate follow-ups"
                      >
                        <ThumbsUp size={14} />
                      </button>
                      <button
                        onClick={() => handleThumbsDown(message.id)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          border: 'none',
                          background: 'transparent',
                          color: currentTheme.text,
                          fontSize: '11px',
                          cursor: 'pointer',
                        }}
                        title="Bad response - Regenerate"
                      >
                        <ThumbsDown size={14} />
                      </button>
                    </>
                  )}
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
                        <RotateCcw size={14} />
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
          <button
            onClick={() => setFollowUpsCollapsed(!followUpsCollapsed)}
            style={{
              fontSize: '12px',
              color: currentTheme.text,
              marginBottom: followUpsCollapsed ? '0' : '8px',
              opacity: 0.8,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 0',
            }}
          >
            {followUpsCollapsed ? (
              <ChevronRight size={14} />
            ) : (
              <ChevronDown size={14} />
            )}
            <span>Suggested follow-up questions</span>
          </button>
          {!followUpsCollapsed && (
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
          )}
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
        {/* Response Mode Selector - Hide for reasoning models */}
        {!['deepseek', 'openai-reasoning', 'deepseek-reasoning'].includes(
          selectedModel
        ) && (
          <div
            style={{
              marginBottom: '12px',
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                fontSize: '12px',
                color: currentTheme.text,
                opacity: 0.8,
              }}
            >
              Mode:
            </span>
            <div style={{ display: 'flex', gap: '4px' }}>
              {(['none', 'reason', 'rush'] as ResponseMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setResponseMode(mode)}
                  style={{
                    padding: '4px 12px',
                    borderRadius: '6px',
                    border: `1px solid ${currentTheme.border}`,
                    background:
                      responseMode === mode
                        ? 'rgba(102, 126, 234, 0.3)'
                        : currentTheme.messageBg,
                    color: currentTheme.text,
                    fontSize: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {mode === 'none' && (
                    <>
                      <Circle
                        size={12}
                        style={{
                          color:
                            responseMode === 'none'
                              ? currentTheme.iconPrimary
                              : currentTheme.text,
                        }}
                      />
                      None
                    </>
                  )}
                  {mode === 'reason' && (
                    <>
                      <Brain
                        size={12}
                        style={{
                          color:
                            responseMode === 'reason'
                              ? currentTheme.iconSecondary
                              : currentTheme.text,
                        }}
                      />
                      Reason
                    </>
                  )}
                  {mode === 'rush' && (
                    <>
                      <Zap
                        size={12}
                        style={{
                          color:
                            responseMode === 'rush'
                              ? currentTheme.iconAccent
                              : currentTheme.text,
                        }}
                      />
                      Rush
                    </>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
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
        <div
          style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-end',
            ...(theme === 'openwebui'
              ? {
                  background: '#ffffff',
                  padding: '16px',
                  borderRadius: '24px',
                  boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
                }
              : {}),
          }}
        >
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
                  borderRadius: theme === 'openwebui' ? '16px' : '12px',
                  border: 'none',
                  background:
                    uploadedImages.length > 0
                      ? 'rgba(16, 185, 129, 0.8)'
                      : theme === 'openwebui'
                        ? '#f3f4f6'
                        : currentTheme.messageBg,
                  color: currentTheme.text,
                  fontSize: '20px',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="Upload images"
              >
                <ImageIcon size={20} />
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
              borderRadius: theme === 'openwebui' ? '16px' : '12px',
              border:
                theme === 'openwebui'
                  ? 'none'
                  : `1px solid ${currentTheme.border}`,
              background:
                theme === 'openwebui' ? '#f3f4f6' : currentTheme.messageBg,
              color: currentTheme.text,
              fontSize: '14px',
              resize: 'none',
              minHeight: '50px',
              maxHeight: '150px',
            }}
          />
          {isLoading ? (
            <button
              onClick={stopGeneration}
              style={{
                padding: '12px 24px',
                borderRadius: theme === 'openwebui' ? '16px' : '12px',
                border: 'none',
                background: '#ef4444',
                color: 'white',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                minWidth: '80px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                justifyContent: 'center',
              }}
            >
              ⏹ Stop
            </button>
          ) : (
            <button
              onClick={sendMessage}
              disabled={!input.trim()}
              style={{
                padding: '12px 24px',
                borderRadius: theme === 'openwebui' ? '16px' : '12px',
                border: 'none',
                background: theme === 'openwebui' ? '#2563eb' : '#667eea',
                color: 'white',
                fontSize: '14px',
                fontWeight: 600,
                cursor: input.trim() ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
                minWidth: '80px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                justifyContent: 'center',
              }}
            >
              <Send size={16} />
              Send
            </button>
          )}
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

      {/* Toast Notifications */}
      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              background:
                toast.type === 'success'
                  ? '#10b981'
                  : toast.type === 'error'
                    ? '#ef4444'
                    : '#3b82f6',
              color: 'white',
              fontSize: '14px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              animation: 'slideIn 0.3s ease-out',
              minWidth: '200px',
              maxWidth: '400px',
            }}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}
