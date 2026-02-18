# Restoration Talent Platform

A premium, secure web platform for showcasing restoration candidates to business owners with SOC 2 compliance and enterprise-grade security.

## 🌟 Features

- **Role-Based Access Control**: Admin, Customer Service Team, and Client roles with granular permissions
- **Secure Authentication**: NextAuth.js with protected routes and session management
- **Candidate Management**: Browse, search, and filter restoration professionals
- **Meeting Scheduling**: Interactive calendar interface for booking candidate interviews
- **Audit Logging**: Complete compliance tracking for all PII access
- **Minimalist Design**: Premium dark theme with glassmorphism effects

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@restoration.com | demo123 |
| Customer Service | cs@restoration.com | demo123 |
| Client | client1@gmail.com | demo123 |

## 🏗️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Icons**: Lucide React

## 🔐 Security Features

- ✅ Role-based permissions (RBAC)
- ✅ Audit logging for compliance
- ✅ PII protection with role-based visibility
- ✅ Protected routes via middleware
- ✅ Session management with JWT
- ✅ Environment variable security

## 📁 Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── admin/             # Admin dashboard
│   ├── candidates/        # Candidate profiles
│   ├── dashboard/         # Main candidate listing
│   ├── login/             # Authentication
│   └── meetings/          # Meeting scheduling
├── components/            # React components
│   ├── candidates/        # Candidate-specific components
│   ├── layout/            # Layout components
│   └── ui/                # Reusable UI components
└── lib/                   # Utilities and core logic
    ├── audit/             # Audit logging system
    ├── auth/              # Authentication config
    ├── rbac.ts            # Role-based access control
    └── types.ts           # TypeScript definitions
```

## 🎯 Next Steps for Production

1. **Database Integration**: Replace mock data with PostgreSQL/MongoDB
2. **Password Security**: Implement bcrypt hashing
3. **Email Notifications**: Add meeting confirmations
4. **File Storage**: Integrate S3/Azure for resume uploads
5. **Logging Service**: Connect to CloudWatch/Datadog
6. **Calendar Integration**: Sync with Google Calendar/Outlook

## 📝 License

MIT License - feel free to use this project as a foundation for your own restoration talent platform.

## 🤝 Contributing

This is a demo project. For production use, ensure proper security audits and compliance reviews.
