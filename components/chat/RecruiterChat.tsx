'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, RotateCcw, Copy, Check, ThumbsUp, ThumbsDown, Pin, Share2, RefreshCw, MoreHorizontal, MessageSquare } from 'lucide-react';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

interface MessageFeedback {
    [messageId: string]: {
        vote?: 'up' | 'down';
        copied?: boolean;
        pinned?: boolean;
    };
}

const QUICK_ACTIONS = [
    { label: '👩‍💼 I need an Office Admin', prompt: 'I\'m looking for a virtual Office Admin for my restoration company. Can you help me find the right person?' },
    { label: '📋 Help me find a Project Manager', prompt: 'I need a Project Manager who can help coordinate restoration jobs remotely. What candidates do you have?' },
    { label: '⚡ Who\'s available right now?', prompt: 'Which candidates are available for immediate hire? I need someone to start as soon as possible.' },
    { label: '🤔 Not sure what I need', prompt: 'I\'m not exactly sure what role I need to fill. Can you help me figure out what kind of support would help my business the most?' },
];

interface RecruiterChatProps {
    clientEmail?: string;
    clientName?: string;
}

export function RecruiterChat({ clientEmail, clientName }: RecruiterChatProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [feedback, setFeedback] = useState<MessageFeedback>({});
    const [sessionId] = useState(() => `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (messageText?: string) => {
        const text = messageText || input.trim();
        if (!text || isStreaming) return;

        const userMessage: Message = {
            id: `msg-${Date.now()}`,
            role: 'user',
            content: text,
        };

        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);
        setInput('');
        setIsStreaming(true);

        const assistantMessage: Message = {
            id: `msg-${Date.now() + 1}`,
            role: 'assistant',
            content: '',
        };

        setMessages([...updatedMessages, assistantMessage]);

        try {
            const response = await fetch('/api/client-agent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: updatedMessages.map(m => ({
                        role: m.role,
                        content: m.content,
                    })),
                    sessionId,
                    clientEmail,
                    clientName,
                }),
            });

            if (!response.ok) {
                let errorMessage = 'Failed to get response';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                } catch {
                    errorMessage = `Server error (${response.status}). The API endpoint may not be available.`;
                }
                throw new Error(errorMessage);
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) throw new Error('No response stream');

            let fullText = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') break;

                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.text) {
                                fullText += parsed.text;
                                setMessages(prev => {
                                    const updated = [...prev];
                                    const lastMsg = updated[updated.length - 1];
                                    if (lastMsg.role === 'assistant') {
                                        lastMsg.content = fullText;
                                    }
                                    return [...updated];
                                });
                            }
                            if (parsed.error) {
                                throw new Error(parsed.error);
                            }
                        } catch (e) {
                            // Skip invalid JSON lines
                        }
                    }
                }
            }
        } catch (error: any) {
            setMessages(prev => {
                const updated = [...prev];
                const lastMsg = updated[updated.length - 1];
                if (lastMsg.role === 'assistant') {
                    lastMsg.content = `⚠️ Error: ${error.message}`;
                }
                return [...updated];
            });
        } finally {
            setIsStreaming(false);
            inputRef.current?.focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleClear = () => {
        setMessages([]);
        setFeedback({});
    };

    const handleCopy = async (messageId: string, content: string) => {
        await navigator.clipboard.writeText(content);
        setFeedback(prev => ({ ...prev, [messageId]: { ...prev[messageId], copied: true } }));
        setTimeout(() => {
            setFeedback(prev => ({ ...prev, [messageId]: { ...prev[messageId], copied: false } }));
        }, 2000);
    };

    const handleVote = (messageId: string, vote: 'up' | 'down') => {
        setFeedback(prev => {
            const current = prev[messageId]?.vote;
            return {
                ...prev,
                [messageId]: {
                    ...prev[messageId],
                    vote: current === vote ? undefined : vote,
                },
            };
        });
    };

    const handlePin = (messageId: string) => {
        setFeedback(prev => ({
            ...prev,
            [messageId]: { ...prev[messageId], pinned: !prev[messageId]?.pinned },
        }));
    };

    const stripMarkdown = (text: string) => {
        return text
            .replace(/```[\w]*\n([\s\S]*?)```/g, '$1')  // code blocks
            .replace(/`([^`]+)`/g, '$1')                  // inline code
            .replace(/\*\*([^*]+)\*\*/g, '$1')            // bold
            .replace(/\*([^*]+)\*/g, '$1')                // italic
            .replace(/^#{1,3}\s+/gm, '')                  // headings
            .replace(/^[-•]\s+/gm, '• ')                  // bullet points
            .trim();
    };

    const handleShare = async (content: string) => {
        const cleanText = stripMarkdown(content);
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Recruiter AI Recommendation — Karma Staff',
                    text: cleanText,
                });
            } catch (e) {
                // User cancelled the share dialog
            }
        } else {
            await navigator.clipboard.writeText(cleanText);
        }
    };

    const handleRegenerate = (messageId: string) => {
        const msgIndex = messages.findIndex(m => m.id === messageId);
        if (msgIndex > 0) {
            const prevUserMsg = messages[msgIndex - 1];
            if (prevUserMsg.role === 'user') {
                setMessages(prev => prev.filter(m => m.id !== messageId));
                setTimeout(() => handleSend(prevUserMsg.content), 100);
            }
        }
    };

    const formatContent = (content: string) => {
        return content
            .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="bg-black/30 rounded-lg p-4 my-3 overflow-x-auto text-sm font-mono border border-border/30"><code>$2</code></pre>')
            .replace(/`([^`]+)`/g, '<code class="bg-black/30 px-1.5 py-0.5 rounded text-sm font-mono text-primary">$1</code>')
            .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-foreground">$1</strong>')
            .replace(/^\s*[-•]\s+(.+)/gm, '<li class="ml-4 list-disc">$1</li>')
            .replace(/^\s*(\d+)\.\s+(.+)/gm, '<li class="ml-4 list-decimal">$2</li>')
            .replace(/^#{3}\s+(.+)/gm, '<h3 class="text-base font-bold mt-4 mb-2 text-primary/90">$1</h3>')
            .replace(/^#{2}\s+(.+)/gm, '<h2 class="text-lg font-bold mt-5 mb-2 text-primary">$1</h2>')
            .replace(/^#{1}\s+(.+)/gm, '<h1 class="text-xl font-bold mt-5 mb-3 text-primary">$1</h1>')
            .replace(/\n/g, '<br/>');
    };

    return (
        <div className="flex flex-col h-[calc(100vh-180px)] max-h-[800px]">
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 pb-4 pr-2 scrollbar-thin">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center px-4">
                        <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 mb-6">
                            <MessageSquare className="w-12 h-12 text-blue-400" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Hi there! 👋</h2>
                        <p className="text-muted-foreground text-sm max-w-md mb-2">
                            I&apos;m your dedicated recruiter assistant. I&apos;ll help you find the perfect virtual team member for your business.
                        </p>
                        <p className="text-muted-foreground/60 text-xs max-w-sm mb-8">
                            Tell me about the role you&apos;re hiring for, or choose an option below to get started.
                        </p>

                        {/* Quick Actions */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                            {QUICK_ACTIONS.map((action, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSend(action.prompt)}
                                    className="text-left p-4 rounded-xl bg-card/40 border border-border/50 hover:border-blue-400/40 hover:bg-card/60 transition-all duration-200 group"
                                >
                                    <span className="text-sm font-medium group-hover:text-blue-400 transition-colors">
                                        {action.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <>
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                            >
                                {/* Avatar */}
                                <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${message.role === 'user'
                                    ? 'bg-primary/20'
                                    : 'bg-blue-500/20'
                                    }`}>
                                    {message.role === 'user' ? (
                                        <User className="w-4 h-4 text-primary" />
                                    ) : (
                                        <MessageSquare className="w-4 h-4 text-blue-400" />
                                    )}
                                </div>

                                {/* Message Bubble */}
                                <div className={`max-w-[80%] rounded-xl px-4 py-3 ${message.role === 'user'
                                    ? 'bg-primary/15 border border-primary/20'
                                    : 'bg-card/60 border border-border/50'
                                    }`}>
                                    {message.role === 'assistant' && message.content === '' && isStreaming ? (
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span className="text-sm">Finding the best match for you...</span>
                                        </div>
                                    ) : (
                                        <div
                                            className="text-sm leading-relaxed prose-sm"
                                            dangerouslySetInnerHTML={{ __html: formatContent(message.content) }}
                                        />
                                    )}

                                    {/* Action bar for completed assistant messages */}
                                    {message.role === 'assistant' && message.content !== '' && !(isStreaming && message.id === messages[messages.length - 1]?.id) && (
                                        <div className="flex items-center gap-1 mt-3 pt-2 border-t border-border/20">
                                            <button
                                                onClick={() => handleCopy(message.id, message.content)}
                                                className="p-1.5 rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-secondary/50 transition-all duration-150"
                                                title="Copy"
                                            >
                                                {feedback[message.id]?.copied ? (
                                                    <Check className="w-3.5 h-3.5 text-green-400" />
                                                ) : (
                                                    <Copy className="w-3.5 h-3.5" />
                                                )}
                                            </button>
                                            <button
                                                onClick={() => handleVote(message.id, 'up')}
                                                className={`p-1.5 rounded-md transition-all duration-150 ${feedback[message.id]?.vote === 'up'
                                                    ? 'text-primary bg-primary/10'
                                                    : 'text-muted-foreground/50 hover:text-foreground hover:bg-secondary/50'
                                                    }`}
                                                title="Good response"
                                            >
                                                <ThumbsUp className="w-3.5 h-3.5" fill={feedback[message.id]?.vote === 'up' ? 'currentColor' : 'none'} />
                                            </button>
                                            <button
                                                onClick={() => handleVote(message.id, 'down')}
                                                className={`p-1.5 rounded-md transition-all duration-150 ${feedback[message.id]?.vote === 'down'
                                                    ? 'text-red-400 bg-red-400/10'
                                                    : 'text-muted-foreground/50 hover:text-foreground hover:bg-secondary/50'
                                                    }`}
                                                title="Bad response"
                                            >
                                                <ThumbsDown className="w-3.5 h-3.5" fill={feedback[message.id]?.vote === 'down' ? 'currentColor' : 'none'} />
                                            </button>
                                            <button
                                                onClick={() => handlePin(message.id)}
                                                className={`p-1.5 rounded-md transition-all duration-150 ${feedback[message.id]?.pinned
                                                    ? 'text-amber-400 bg-amber-400/10'
                                                    : 'text-muted-foreground/50 hover:text-foreground hover:bg-secondary/50'
                                                    }`}
                                                title="Pin"
                                            >
                                                <Pin className="w-3.5 h-3.5" fill={feedback[message.id]?.pinned ? 'currentColor' : 'none'} />
                                            </button>
                                            <button
                                                onClick={() => handleShare(message.content)}
                                                className="p-1.5 rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-secondary/50 transition-all duration-150"
                                                title="Share"
                                            >
                                                <Share2 className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => handleRegenerate(message.id)}
                                                className="p-1.5 rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-secondary/50 transition-all duration-150"
                                                title="Regenerate"
                                            >
                                                <RefreshCw className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                className="p-1.5 rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-secondary/50 transition-all duration-150"
                                                title="More"
                                            >
                                                <MoreHorizontal className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Input Area */}
            <div className="border-t border-border/30 pt-4 mt-2">
                {messages.length > 0 && (
                    <div className="flex justify-end mb-3">
                        <button
                            onClick={handleClear}
                            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors px-2 py-1 rounded-lg hover:bg-secondary/50"
                        >
                            <RotateCcw className="w-3 h-3" />
                            New conversation
                        </button>
                    </div>
                )}
                <div className="flex gap-3 items-end">
                    <div className="flex-1 relative">
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Tell me about the role you're looking to fill..."
                            className="w-full resize-none rounded-xl border border-border/50 bg-secondary/30 px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/40 placeholder:text-muted-foreground/50 hover:border-border transition-colors min-h-[48px] max-h-[120px]"
                            rows={1}
                            disabled={isStreaming}
                            onInput={(e) => {
                                const target = e.target as HTMLTextAreaElement;
                                target.style.height = 'auto';
                                target.style.height = Math.min(target.scrollHeight, 120) + 'px';
                            }}
                        />
                    </div>
                    <button
                        onClick={() => handleSend()}
                        disabled={!input.trim() || isStreaming}
                        className="p-3 rounded-xl bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/20 flex-shrink-0"
                    >
                        {isStreaming ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Send className="w-5 h-5" />
                        )}
                    </button>
                </div>
                <p className="text-[11px] text-muted-foreground/40 text-center mt-2">
                    Your dedicated recruiter, helping you find the perfect virtual team member.
                </p>
            </div>
        </div>
    );
}
