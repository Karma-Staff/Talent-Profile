import { NextRequest } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '@/lib/db';
import { getClientSystemPrompt } from '@/lib/client-agent-prompt';
import { ClientChatSession } from '@/lib/types';

export async function POST(request: NextRequest) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey || apiKey === 'your-gemini-api-key-here') {
            return new Response(
                JSON.stringify({ error: 'GEMINI_API_KEY is not configured. Please add it to your .env.local file.' }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const body = await request.json();
        const { messages, sessionId, clientEmail, clientName } = body;

        if (!messages || !Array.isArray(messages)) {
            return new Response(
                JSON.stringify({ error: 'Invalid request: messages array required' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Load current candidate data and build system prompt
        const candidates = db.getCandidates();
        const systemPrompt = getClientSystemPrompt(candidates);

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        // Build conversation history for Gemini
        const history = messages.slice(0, -1).map((msg: { role: string; content: string }) => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }],
        }));

        const lastMessage = messages[messages.length - 1];

        const chat = model.startChat({
            history: [
                {
                    role: 'user',
                    parts: [{ text: systemPrompt }],
                },
                {
                    role: 'model',
                    parts: [{ text: 'Understood. I\'m ready to help clients find their perfect virtual team member. I\'ll be conversational, professional, and gently guide them toward the best candidate matches.' }],
                },
                ...history,
            ],
        });

        // Stream the response and collect full text for saving
        const result = await chat.sendMessageStream(lastMessage.content);
        let fullAssistantResponse = '';

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of result.stream) {
                        const text = chunk.text();
                        if (text) {
                            fullAssistantResponse += text;
                            controller.enqueue(
                                encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
                            );
                        }
                    }
                    controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                    controller.close();

                    // Save the conversation after streaming completes
                    if (sessionId && clientEmail) {
                        const now = new Date().toISOString();
                        const chatSession: ClientChatSession = {
                            id: sessionId,
                            clientEmail: clientEmail || 'unknown',
                            clientName: clientName || 'Unknown Client',
                            startedAt: messages.length <= 1 ? now : '',
                            lastMessageAt: now,
                            messages: [
                                ...messages.map((m: { role: string; content: string }) => ({
                                    role: m.role as 'user' | 'assistant',
                                    content: m.content,
                                    timestamp: now,
                                })),
                                {
                                    role: 'assistant' as const,
                                    content: fullAssistantResponse,
                                    timestamp: now,
                                },
                            ],
                        };

                        // Preserve the original startedAt if session exists
                        const existing = db.getClientChats().find(c => c.id === sessionId);
                        if (existing) {
                            chatSession.startedAt = existing.startedAt;
                        } else {
                            chatSession.startedAt = now;
                        }

                        db.saveClientChat(chatSession);
                    }
                } catch (error: any) {
                    controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({ error: error.message || 'Stream error' })}\n\n`)
                    );
                    controller.close();
                }
            },
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });
    } catch (error: any) {
        console.error('Client Agent API error:', error);
        return new Response(
            JSON.stringify({ error: error.message || 'Internal server error' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
