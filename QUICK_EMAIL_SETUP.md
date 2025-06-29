# Quick Email Setup

To enable the email functionality in Task Breakdown Expert:

## 1. Sign up for Resend (Free)
- Go to [resend.com](https://resend.com)
- Create a free account (3,000 emails/month included)
- Get your API key from the dashboard

## 2. Add API Key to Environment
Replace `your_resend_api_key_here` in your `.env` file:

```bash
RESEND_API_KEY=re_your_actual_api_key_here
```

## 3. Restart Your Development Server
```bash
npm run dev
```

## 4. Test It!
1. Generate a task breakdown
2. Enter your email in the "Export Breakdown" section
3. Click "Send Learning Plan to Email"
4. Check your inbox (and spam folder)

That's it! The email will contain a beautifully formatted version of the learning plan with weekly breakdowns.

## For Production Use
- Verify your own domain in Resend
- Update the `from` address in `/src/app/api/send-email/route.ts`
- Consider upgrading to a paid Resend plan for higher volume
