export { default } from 'next-auth/middleware';

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/candidates/:path*',
        '/meetings/:path*',
        '/admin/:path*',
    ],
};
