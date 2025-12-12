# 💰 Vibe Budget - Personal Finance Management App

Modern personal finance management application built with Next.js 16, featuring AI-powered insights using Claude AI.

## ✨ Features

- **Transaction Management** - Add, edit, categorize transactions
- **Multi-Bank Support** - Track multiple bank accounts
- **AI Financial Health Score** - 0-10 score with grades (A+ to F)
- **Smart Budget Recommendations** - AI-powered savings suggestions
- **Anomaly Detection** - Automatic unusual spending alerts
- **Reports & Analytics** - Visual charts and insights
- **Multi-Currency Support** - RON, EUR, USD, GBP

## 🚀 Tech Stack

- **Next.js 16.0.7** - App Router with Turbopack
- **React 19.2.0** - Latest React features
- **TypeScript** - Full type safety
- **Tailwind CSS 4** - Modern styling
- **Anthropic Claude Sonnet 4.5** - AI integration
- **Drizzle ORM** - Type-safe database
- **SQLite** - Local database

## 📦 Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/vibe-budget.git
cd vibe-budget
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
# Generate with: openssl rand -base64 32
JWT_SECRET=your-secret-key-here

# Get from: https://console.anthropic.com/
ANTHROPIC_API_KEY=your-claude-api-key-here
```

4. **Initialize database**
```bash
npx tsx scripts/init-db.ts
npx tsx scripts/create-test-user.ts
```

5. **Start development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Test credentials:**
- Email: `test@vibe-budget.com`
- Password: `password123`

## 🗄️ Database Scripts

```bash
# Initialize schema
npx tsx scripts/init-db.ts

# Create test user
npx tsx scripts/create-test-user.ts

# Add sample transactions
npx tsx scripts/add-december-to-existing-user.ts test@vibe-budget.com
```

## 🚀 Deploy to Vercel

1. **Push to GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/vibe-budget.git
git push -u origin main
```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your repository

3. **Set Environment Variables in Vercel**

   Go to Settings → Environment Variables:
   ```
   JWT_SECRET=<generate-new-secret>
   ANTHROPIC_API_KEY=<your-claude-key>
   ```

4. **Deploy** - Click Deploy and wait 2-3 minutes

## 📊 AI Features

### Financial Health Score
- **Cash Flow** - Income vs expenses analysis
- **Diversification** - Spending distribution
- **Savings Rate** - Percentage saved

### Budget Recommendations
- Category-specific savings suggestions
- Annual savings potential calculations
- Actionable steps to reduce spending

### Anomaly Detection
- Flags unusual transactions
- Severity levels: low, medium, high
- Smart pattern recognition

## 📁 Project Structure

```
vibe-budget/
├── app/
│   ├── dashboard/              # Main app pages
│   │   ├── page.tsx           # Dashboard with Health Score
│   │   ├── reports/           # Analytics
│   │   ├── ai-insights/       # AI analysis page
│   │   └── transactions/      # Transaction management
│   │
│   └── api/
│       ├── auth/              # Authentication
│       └── ai/                # AI endpoints
│
├── lib/
│   ├── ai/claude.ts           # Claude AI integration
│   ├── db/                    # Database schema
│   └── auth.ts                # JWT utilities
│
└── scripts/                   # Database scripts
```

## 💡 Development

```bash
npm run dev     # Start dev server
npm run build   # Build for production
npm run start   # Start production server
```

## 📝 License

MIT License - see [LICENSE](LICENSE) file

## 🙏 Acknowledgments

- Anthropic for Claude AI
- Vercel for hosting
- Next.js team

---

Made with ❤️ using Next.js 16 and Claude AI
