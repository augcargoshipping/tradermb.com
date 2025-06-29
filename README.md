# TRADE RMB - Ghana Currency Exchange

A modern, responsive web application for currency exchange from GHS to RMB.

## Features

- **Real-time Currency Conversion**: 1 GHS = 0.54 RMB
- **Responsive Design**: Works perfectly on desktop and mobile devices
- **Secure Form Processing**: Industry-standard form validation
- **Clean UI**: Built with shadcn/ui components

## Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Deployment**: Vercel (recommended)

## Quick Start

### 1. Clone and Install

\`\`\`bash
git clone <your-repo-url>
cd rmb-trade
npm install
\`\`\`

### 2. Environment Setup

Copy the environment example file:

\`\`\`bash
cp .env.example .env.local
\`\`\`

### 3. Development

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Production Build

\`\`\`bash
npm run build
npm start
\`\`\`

## Project Structure

\`\`\`
rmb-trade/
├── app/                    # Next.js app directory
│   ├── checkout/          # Checkout page
│   ├── confirmation/      # Confirmation page
│   ├── purchase/          # Purchase form page
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   └── ui/               # shadcn/ui components
├── lib/                   # Utility functions
│   └── utils.ts          # General utilities
├── public/               # Static assets
└── package.json          # Dependencies
\`\`\`

## Pages

- `/` - Landing page with exchange rate display
- `/purchase` - Purchase form for RMB exchange
- `/confirmation` - Order confirmation with payment instructions
- `/checkout` - Payment processing page

## Adding API Integrations

This project is set up as a clean foundation. To add API integrations:

1. Create API routes in `app/api/`
2. Add environment variables to `.env.local`
3. Create service files in `lib/`
4. Update forms to use real API endpoints

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Other Platforms

The application can be deployed to any platform that supports Next.js:

- **Netlify**: Use `@netlify/plugin-nextjs`
- **Railway**: Direct deployment support
- **DigitalOcean App Platform**: Node.js app
- **AWS Amplify**: Full-stack deployment

## Support

For technical support or business inquiries:

- Email: support@rmbtradegh.com
- Phone: +233 XX XXX XXXX
- Website: https://rmbtradegh.com

## License

© 2025 RMB TRADE. All rights reserved.
# rmbtrade-
