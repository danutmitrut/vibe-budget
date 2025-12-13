# 💰 Vibe Budget - Personal Finance Management App

Modern personal finance management application built with Next.js 16, featuring AI-powered insights using Claude AI.

> 🎓 **Pentru Cursanți/Instructori:** Consultă **[docs/STUDENT_GUIDE_COMPLETE.md](docs/STUDENT_GUIDE_COMPLETE.md)** pentru curriculum complet de 2 săptămâni cu plan zilnic, exerciții și resurse!

---

## 📚 Documentație Completă pentru Cursanți

| Ghid | Descriere | Când să-l folosești |
|------|-----------|---------------------|
| **[🎓 STUDENT_GUIDE_COMPLETE.md](docs/STUDENT_GUIDE_COMPLETE.md)** | **Curriculum complet 2 săptămâni** - Plan zilnic, concepte cheie, exerciții | **START HERE!** - Înainte de curs |
| [📖 EXCEL_PARSING_GUIDE.md](docs/EXCEL_PARSING_GUIDE.md) | Excel serial numbers, diacritice românești, schema database | Ziua 7 - Upload Excel/CSV |
| [🚀 DEPLOYMENT_COMPLETE_GUIDE.md](docs/DEPLOYMENT_COMPLETE_GUIDE.md) | Vercel + Supabase step-by-step, troubleshooting | Ziua 10 - Production deploy |
| [🔧 TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) | Erori comune și soluții | Când întâmpini probleme |
| [📝 .env.example](.env.example) | Template environment variables cu explicații | Setup inițial |

---

## ✨ Features

- **Transaction Management** - Add, edit, categorize transactions with bulk operations
- **Multi-Bank Support** - Track multiple bank accounts (Revolut, ING, BT, etc.)
- **Excel/CSV Import** - Smart parsing with Romanian diacritics support
- **Auto-Categorization** - Intelligent category detection from descriptions
- **AI Financial Health Score** - 0-10 score with grades (A+ to F)
- **Smart Budget Recommendations** - AI-powered savings suggestions
- **Anomaly Detection** - Automatic unusual spending alerts
- **Reports & Analytics** - Visual charts and pivot tables
- **Multi-Currency Support** - RON, EUR, USD, GBP

## 🚀 Tech Stack

- **Next.js 16.0.7** - App Router with Turbopack
- **React 19.2.0** - Latest React features
- **TypeScript** - Full type safety
- **Tailwind CSS 4** - Modern styling
- **Anthropic Claude Sonnet 4.5** - AI integration
- **Drizzle ORM** - Type-safe database
- **Supabase PostgreSQL** - Production database (cloud)
- **SQLite** - Local development (optional)

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

## 🚀 Deploy to Vercel + Supabase

**📚 Complete Deployment Guide:** [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)

**Quick Start:**

1. **Setup Supabase Database**
   - Create Supabase project
   - Run SQL schema (see [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md))
   - Get **Transaction Pooler** connection string (IPv4 compatible!)

2. **Push to GitHub**
   ```bash
   git push origin main
   ```

3. **Deploy to Vercel**
   - Import repository on [vercel.com](https://vercel.com)
   - Set environment variables:
     - `DATABASE_URL` - Supabase Transaction Pooler connection string
     - `JWT_SECRET` - Generate with `openssl rand -base64 32`
     - `ANTHROPIC_API_KEY` - Your Claude API key
   - Deploy!

**⚠️ Important:** Use **Transaction Pooler** (port 6543), NOT Direct Connection (port 5432)!

**📖 Complete Deployment Guide:**
- **[🚀 DEPLOYMENT_COMPLETE_GUIDE.md](docs/DEPLOYMENT_COMPLETE_GUIDE.md)** - Step-by-step with troubleshooting
- [Database Configuration](docs/DATABASE_SETUP.md) - Additional database notes
- [Troubleshooting](docs/TROUBLESHOOTING.md) - Common errors

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
│   ├── dashboard/                      # Main app pages
│   │   ├── page.tsx                   # Dashboard with Health Score
│   │   ├── upload/page.tsx            # Excel/CSV import ⭐
│   │   ├── transactions/page.tsx      # Transaction management
│   │   ├── reports/                   # Analytics & Charts
│   │   └── ai-insights/               # AI analysis page
│   │
│   └── api/
│       ├── auth/                      # Authentication (register, login)
│       ├── transactions/              # CRUD transactions ⭐
│       ├── ai/                        # AI endpoints (health score, etc.)
│       └── reports/                   # Statistics & Pivot
│
├── lib/
│   ├── ai/claude.ts                   # Claude AI integration
│   ├── db/
│   │   ├── schema.ts                  # Database schema (Drizzle ORM) ⭐
│   │   └── index.ts                   # DB connection
│   ├── auth/
│   │   ├── utils.ts                   # JWT generation/verification ⭐
│   │   └── get-current-user.ts        # Auth middleware
│   ├── utils/
│   │   └── file-parser.ts             # Excel/CSV parsing ⭐⭐⭐
│   └── auto-categorization/           # Category detection rules
│
├── scripts/                           # Database initialization
├── docs/                              # 📚 Complete documentation
│   ├── STUDENT_GUIDE_COMPLETE.md      # 🎓 START HERE for students!
│   ├── EXCEL_PARSING_GUIDE.md         # Excel parsing deep-dive
│   └── DEPLOYMENT_COMPLETE_GUIDE.md   # Production deployment
│
└── migrations/                        # SQL migrations

⭐ = Core files to understand
⭐⭐⭐ = Most complex (Excel parsing with diacritics)
```

## 💡 Development

```bash
npm run dev              # Start dev server (http://localhost:3000)
npm run build            # Build for production (check TypeScript errors)
npm run start            # Start production server

# Database scripts
npx tsx scripts/init-db.ts                              # Initialize schema
npx tsx scripts/create-test-user.ts                     # Create test user
npx tsx scripts/add-december-to-existing-user.ts EMAIL  # Add sample data
```

## 🎓 Learning Path (2 Weeks)

**Week 1: Foundations**
1. Day 1-2: Next.js setup, TypeScript, Tailwind
2. Day 3: Database schema (Drizzle ORM)
3. Day 4-5: Authentication (JWT + bcrypt)

**Week 2: Features & Deploy**
1. Day 6: CRUD transactions
2. Day 7: **Excel/CSV import** (most complex!)
3. Day 8: Dashboard & Reports
4. Day 9: AI integration
5. Day 10: **Production deployment**

**📖 Complete curriculum:** [docs/STUDENT_GUIDE_COMPLETE.md](docs/STUDENT_GUIDE_COMPLETE.md)

## 🚨 Common Issues & Solutions

| Problem | Solution |
|---------|----------|
| **All dates show "01.01.1970"** | Excel serial numbers not converted → See [EXCEL_PARSING_GUIDE.md](docs/EXCEL_PARSING_GUIDE.md) |
| **"getaddrinfo ENOTFOUND" on Vercel** | Using Direct Connection instead of Transaction Pooler → See [DEPLOYMENT_COMPLETE_GUIDE.md](docs/DEPLOYMENT_COMPLETE_GUIDE.md) |
| **"0 transactions" when uploading Excel** | Romanian diacritics encoding (Ă → Ä) → See [EXCEL_PARSING_GUIDE.md](docs/EXCEL_PARSING_GUIDE.md) |
| **TypeScript errors after schema change** | Date type mismatch → Use string comparisons with `.toISOString().split('T')[0]` |

**Full troubleshooting:** [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)

## 📝 License

MIT License - see [LICENSE](LICENSE) file

## 🙏 Acknowledgments

- Anthropic for Claude AI (Sonnet 4.5)
- Vercel for hosting platform
- Supabase for PostgreSQL database
- Next.js team for the amazing framework

---

**Built with ❤️ using Next.js 16, React 19, TypeScript, and Claude AI**

**For Students:** Start with [docs/STUDENT_GUIDE_COMPLETE.md](docs/STUDENT_GUIDE_COMPLETE.md) 🎓
