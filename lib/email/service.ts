export interface EmailOptions {
    to: string;
    subject: string;
    body: string;
}

export const emailService = {
    async sendEmail(options: EmailOptions): Promise<void> {
        // In a real application, this would use a service like SendGrid, SES, or Resend
        console.log('--- MOCK EMAIL SENT ---');
        console.log(`To: ${options.to}`);
        console.log(`Subject: ${options.subject}`);
        console.log(`Body: ${options.body}`);
        console.log('------------------------');

        // Simulate network delay
        return new Promise(resolve => setTimeout(resolve, 500));
    },

    async sendMeetingInvite(params: {
        to: string;
        recipientName: string;
        candidateName: string;
        clientName: string;
        date: string;
        time: string;
        type: string;
        notes?: string;
    }): Promise<void> {
        const subject = `Meeting Invitation: ${params.candidateName} x ${params.clientName}`;
        const body = `
Hi ${params.recipientName},

A new meeting has been scheduled:

Details:
- Candidate: ${params.candidateName}
- Client: ${params.clientName}
- Date: ${params.date}
- Time: ${params.time}
- Type: ${params.type.toUpperCase()}

Notes:
${params.notes || 'No extra notes provided.'}

This is an automated notification.
        `.trim();

        await this.sendEmail({ to: params.to, subject, body });
    }
};
