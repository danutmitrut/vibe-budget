/**
 * CLAUDE AI SERVICE - Integrare Anthropic API
 *
 * EXPLICAȚIE:
 * Acest fișier gestionează toate interacțiunile cu Claude AI pentru:
 * - Smart Budget Recommendations
 * - Anomaly Detection
 * - Financial Health Score
 *
 * PENTRU CURSANȚI:
 * Claude este AI-ul de la Anthropic, specializat în conversații naturale și analiză contextuală.
 * Cost: ~$3-8/100 utilizatori/lună (cu prompt caching)
 */

import Anthropic from "@anthropic-ai/sdk";

// Verificăm că avem API key
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!ANTHROPIC_API_KEY) {
  console.warn("⚠️  ANTHROPIC_API_KEY not found in .env.local");
}

// Inițializăm clientul Claude
const anthropic = new Anthropic({
  apiKey: ANTHROPIC_API_KEY || "dummy-key-for-build",
});

/**
 * INTERFEȚE TYPESCRIPT pentru răspunsuri
 */
export interface BudgetRecommendation {
  category: string;
  currentSpending: number;
  suggestedReduction: number;
  potentialSavings: number;
  actionItems: string[];
}

export interface Anomaly {
  description: string;
  amount: number;
  category: string;
  date: string;
  severity: "low" | "medium" | "high";
  suggestion: string;
}

export interface FinancialHealthScore {
  score: number; // 0-10
  grade: string; // A+, A, B, C, D, F
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  breakdown: {
    cashFlow: number; // 0-10
    diversification: number; // 0-10
    savingsRate: number; // 0-10
  };
}

/**
 * FUNCȚIE 1: Smart Budget Recommendations
 *
 * Analizează cheltuielile ultimelor 3-6 luni și oferă sugestii concrete de economisire.
 */
export async function generateBudgetRecommendations(data: {
  monthlyIncome: number;
  categories: Array<{ name: string; amount: number; count: number }>;
  currency: string;
}): Promise<BudgetRecommendation[]> {
  try {
    const prompt = `Ești un consultant financiar expert. Analizează următoarele date despre cheltuielile unui utilizator și oferă 3-5 recomandări concrete de economisire.

VENIT LUNAR: ${data.monthlyIncome} ${data.currency}

CHELTUIELI PE CATEGORII (ultimele 30 zile):
${data.categories.map((cat) => `- ${cat.name}: ${cat.amount} ${data.currency} (${cat.count} tranzacții)`).join("\n")}

INSTRUCȚIUNI:
1. Identifică categoriile cu cele mai mari oportunități de economisire
2. Pentru fiecare recomandare, specifică:
   - Categoria
   - Suma actuală
   - Reducerea sugerată (în ${data.currency})
   - Economii potențiale anuale
   - 2-3 acțiuni concrete și realizabile

3. Fii specific și practic - nu generalități
4. Consideră contextul românesc/moldovenesc (prețuri, stil de viață)

RĂSPUNDE ÎN JSON FORMAT:
[
  {
    "category": "nume categorie",
    "currentSpending": suma_actuala_numerica,
    "suggestedReduction": reducere_sugerata_numerica,
    "potentialSavings": economii_anuale_numerice,
    "actionItems": ["acțiune 1", "acțiune 2", "acțiune 3"]
  }
]`;

    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    // Extragem textul din răspuns
    const content = message.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type");
    }

    // Parse JSON din răspuns
    const jsonMatch = content.text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("Could not parse recommendations");
    }

    const recommendations: BudgetRecommendation[] = JSON.parse(jsonMatch[0]);
    return recommendations;
  } catch (error: any) {
    console.error("❌ Budget recommendations error:", error);
    return [];
  }
}

/**
 * FUNCȚIE 2: Anomaly Detection
 *
 * Detectează cheltuieli neobișnuite care ar putea indica:
 * - Fraude
 * - Erori de categoriz are
 * - Cheltuieli excesive
 */
export async function detectAnomalies(data: {
  recentTransactions: Array<{
    description: string;
    amount: number;
    category: string;
    date: string;
  }>;
  historicalAverage: Record<string, number>; // media pe categorie
  currency: string;
}): Promise<Anomaly[]> {
  try {
    const prompt = `Ești un expert în securitate financiară și detectare fraude. Analizează tranzacțiile recente și identifică anomalii.

TRANZACȚII RECENTE (ultimele 7 zile):
${data.recentTransactions
  .map(
    (t) =>
      `- ${t.date}: ${t.description} | ${t.amount} ${data.currency} | ${t.category}`
  )
  .join("\n")}

MEDIA ISTORICĂ PE CATEGORII (ultimele 3 luni):
${Object.entries(data.historicalAverage)
  .map(([cat, avg]) => `- ${cat}: ${avg} ${data.currency}/lună`)
  .join("\n")}

CAUTĂ ANOMALII:
1. Cheltuieli mult mai mari decât media (>2x)
2. Tranzacții suspecte sau neobișnuite
3. Pattern-uri neașteptate

Pentru fiecare anomalie, specifică:
- Descriere clară
- Suma
- Categoria
- Data
- Severitate (low/medium/high)
- Sugestie de acțiune

RĂSPUNDE ÎN JSON FORMAT:
[
  {
    "description": "descriere anomalie",
    "amount": suma_numerica,
    "category": "categorie",
    "date": "YYYY-MM-DD",
    "severity": "low|medium|high",
    "suggestion": "ce să faci"
  }
]`;

    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type");
    }

    const jsonMatch = content.text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return []; // No anomalies found
    }

    const anomalies: Anomaly[] = JSON.parse(jsonMatch[0]);
    return anomalies;
  } catch (error: any) {
    console.error("❌ Anomaly detection error:", error);
    return [];
  }
}

/**
 * FUNCȚIE 3: Financial Health Score
 *
 * Calculează un scor de sănătate financiară (0-10) bazat pe:
 * - Cash flow (venituri vs cheltuieli)
 * - Diversificare cheltuieli
 * - Rată de economisire
 */
export async function calculateHealthScore(data: {
  monthlyIncome: number;
  monthlyExpenses: number;
  categories: Array<{ name: string; amount: number; percentage: number }>;
  currency: string;
}): Promise<FinancialHealthScore> {
  try {
    const prompt = `Ești un consultant financiar certificat. Calculează scorul de sănătate financiară pentru un utilizator.

DATE FINANCIARE:
- Venit lunar: ${data.monthlyIncome} ${data.currency}
- Cheltuieli lunare: ${data.monthlyExpenses} ${data.currency}
- Balanță: ${data.monthlyIncome - data.monthlyExpenses} ${data.currency}
- Rată economisire: ${(((data.monthlyIncome - data.monthlyExpenses) / data.monthlyIncome) * 100).toFixed(1)}%

DISTRIBUȚIE CHELTUIELI:
${data.categories
  .map((cat) => `- ${cat.name}: ${cat.amount} ${data.currency} (${cat.percentage.toFixed(1)}%)`)
  .join("\n")}

CALCULEAZĂ:
1. Scor total (0-10) - unde 10 = sănătate financiară excelentă
2. Grade (A+, A, B, C, D, F)
3. Breakdown pe 3 dimensiuni (fiecare 0-10):
   - Cash Flow: balanță pozitivă, economii
   - Diversificare: distribuție echilibrată cheltuieli
   - Savings Rate: procent economisit din venit

4. Top 3 puncte forte
5. Top 3 puncte slabe
6. 3-5 recomandări concrete

RĂSPUNDE ÎN JSON FORMAT:
{
  "score": 7.5,
  "grade": "B+",
  "breakdown": {
    "cashFlow": 8.0,
    "diversification": 7.0,
    "savingsRate": 7.5
  },
  "strengths": ["punct forte 1", "punct forte 2", "punct forte 3"],
  "weaknesses": ["punct slab 1", "punct slab 2", "punct slab 3"],
  "recommendations": ["recomandare 1", "recomandare 2", "recomandare 3"]
}`;

    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type");
    }

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse health score");
    }

    const healthScore: FinancialHealthScore = JSON.parse(jsonMatch[0]);
    return healthScore;
  } catch (error: any) {
    console.error("❌ Health score calculation error:", error);
    // Return default/fallback score
    return {
      score: 5.0,
      grade: "C",
      strengths: ["Date insuficiente"],
      weaknesses: ["Necesită mai multe date pentru analiză precisă"],
      recommendations: ["Continuă să înregistrezi tranzacțiile"],
      breakdown: {
        cashFlow: 5.0,
        diversification: 5.0,
        savingsRate: 5.0,
      },
    };
  }
}

/**
 * PENTRU CURSANȚI: OPTIMIZĂRI COST
 *
 * 1. **Prompt Caching** (reduce cost cu 90%)
 *    - Cache system prompts
 *    - Refolosește contextul între cereri
 *
 * 2. **Batch Processing**
 *    - Grupează cereri similare
 *    - Un request pentru multiple users
 *
 * 3. **Model Selection**
 *    - Claude 3.5 Sonnet: best quality/price ratio
 *    - Claude 3 Haiku: 10x mai ieftin, suficient pentru task-uri simple
 *
 * 4. **Rate Limiting**
 *    - Max 1 request/user/oră pentru recommendations
 *    - Cache results 24h
 *
 * 5. **Graceful Degradation**
 *    - Dacă API fail → returnează defaults
 *    - App-ul funcționează și fără AI
 */
