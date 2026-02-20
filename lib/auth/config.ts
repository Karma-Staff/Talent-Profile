import { db } from '@/lib/db';
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                console.log('Login attempt for email:', credentials?.email);

                if (!credentials?.email || !credentials?.password) {
                    console.log('Missing email or password in request.');
                    return null;
                }

                // In production, verify against a secure database with hashed passwords
                try {
                    console.log('Fetching user from DB:', credentials.email);
                    const user = await db.getUserByEmail(credentials.email);
                    console.log('DB Request returned user:', user ? `Found (Role: ${user.role})` : 'Not Found');

                    if (user && credentials.password === 'demo123') {
                        console.log('Password matched demo123, returning successful session.');
                        return {
                            id: user.id,
                            email: user.email,
                            name: user.name,
                            role: user.role,
                        };
                    } else if (user) {
                        console.log('Password did not match demo123!');
                    }
                } catch (err) {
                    console.error('Database connection error during login:', err);
                }

                return null;
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.id = user.id;
                token.role = (user as any).role;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id = token.id;
                (session.user as any).role = token.role;
            }
            return session;
        },
    },
    pages: {
        signIn: '/login',
    },
    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    secret: process.env.NEXTAUTH_SECRET,
};
