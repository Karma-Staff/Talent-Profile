import { NextRequest } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '@/lib/db';

const SYSTEM_PROMPT = `You are a Talent Intelligence Agent for a U.S.-based restoration staffing platform called "Karma Staffing". Your role is to analyze candidate profiles, evaluate fit for roles, and provide structured recommendations.

You have access to the current candidate database. When analyzing candidates, consider:
- Their skills, experience, and bio
- Availability status (immediate, two_weeks, specific_date, hired)
- Location and title/role
- Hobbies and personality indicators

Provide thorough, well-structured analysis using markdown formatting (headers, bullet points, bold text). Be professional but approachable. When ranking candidates, use clear scoring criteria.

Important context:
- These candidates are being evaluated for U.S. small business restoration companies
- Key roles include Office Admin, Project Manager, and similar positions
- Candidates marked as "hired" are no longer available
- Focus on practical skills relevant to restoration industry operations

CLIENT INTELLIGENCE ACCESS:
You also have access to conversations from the client-facing Recruiter AI chatbot. This gives you insight into:
- What roles clients are looking for
- Which candidates clients have shown interest in
- Client budget concerns and hiring timelines
- Questions or objections clients have raised

When asked about client activity, provide reports such as:
- "What are clients asking about?" — summarize recent client chat topics
- "Which candidates are getting the most interest?" — analyze which candidates appear most in client conversations
- "Client engagement report" — overview of all client interactions
- Follow-up recommendations based on client interests

This client data is CONFIDENTIAL and only available to admins. Never expose it to client-facing systems.`;

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
        const { messages } = body;

        if (!messages || !Array.isArray(messages)) {
            return new Response(
                JSON.stringify({ error: 'Invalid request: messages array required' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Load current candidate data
        const candidates = db.getCandidates();
        const candidateContext = `\n\nCurrent Candidate Database (${candidates.length} candidates):\n${JSON.stringify(candidates, null, 2)}`;

        // Load client chat conversations for admin intelligence
        const clientChats = db.getClientChats();
        let clientChatContext = '';
        if (clientChats.length > 0) {
            const chatSummaries = clientChats.map(chat => {
                const userMessages = chat.messages.filter(m => m.role === 'user').map(m => m.content);
                const lastActivity = chat.lastMessageAt;
                return `• Client: ${chat.clientName} (${chat.clientEmail})\n  Session: ${chat.id}\n  Last active: ${lastActivity}\n  Topics discussed: ${userMessages.join(' | ')}`;
            }).join('\n\n');
            clientChatContext = `\n\n--- CLIENT CHAT INTELLIGENCE (Admin Only) ---\nBelow are conversations from the client-facing Recruiter AI chatbot. Use this data to understand client interests, hiring needs, and which candidates they've been exploring. This is confidential admin-only intelligence.\n\nTotal client sessions: ${clientChats.length}\n\n${chatSummaries}\n--- END CLIENT CHAT INTELLIGENCE ---`;
        }

        // Load Client Profiles with Questionnaire Data
        const allUsers = db.getUsers();
        const clientUsers = allUsers.filter(u => u.role === 'client');
        let clientProfileContext = '';
        if (clientUsers.length > 0) {
            const profiles = clientUsers.map(u => {
                return `• Client: ${u.name} (${u.email})
  - Hiring Needs: ${u.hiringNeeds || 'Not specified'}
  - Target Employee Profile: ${u.targetEmployee || 'Not specified'}
  - Software Stack: ${u.softwareStack || 'Not specified'}`;
            }).join('\n\n');
            clientProfileContext = `\n\n--- CLIENT PROFILE INTELLIGENCE (Admin Only) ---\nBelow are the onboarding questionnaires filled out for each client. Use this to answer questions about specific client requirements, software usage, and hiring goals.\n\n${profiles}\n--- END CLIENT PROFILE INTELLIGENCE ---`;
        }

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
                    parts: [{ text: SYSTEM_PROMPT + candidateContext + clientChatContext + clientProfileContext }],
                },
                {
                    role: 'model',
                    parts: [{ text: 'Understood. I\'m ready to analyze candidates and provide staffing recommendations. How can I help?' }],
                },
                ...history,
            ],
        });

        // Stream the response
        const result = await chat.sendMessageStream(lastMessage.content);

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of result.stream) {
                        const text = chunk.text();
                        if (text) {
                            controller.enqueue(
                                encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
                            );
                        }
                    }
                    controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                    controller.close();
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
        console.error('Agent API error:', error);
        return new Response(
            JSON.stringify({ error: error.message || 'Internal server error' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
