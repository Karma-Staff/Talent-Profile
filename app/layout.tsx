'use client';


import { Inter } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import "./globals.css"; // Global styles for the app

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={inter.className} suppressHydrationWarning>
                <SessionProvider>
                    {children}
                </SessionProvider>
            </body>
        </html>
    );
}
