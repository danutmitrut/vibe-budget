/**
 * REGULI CATEGORIZARE AUTOMATĂ
 *
 * EXPLICAȚIE:
 * Acestea sunt reguli universale de categorizare bazate pe cuvinte cheie.
 * Fiecare categorie are o listă de pattern-uri (cuvinte cheie) care identifică
 * comercianți sau tipuri de tranzacții.
 *
 * CATEGORII REDEFINITE (2025-12-20):
 * - Transport: transport în comun sau cheltuieli cu mijlocul personal de transport
 * - Sănătate: medicamente, investigații, consultații, intervenții
 * - Cumpărături: tot ce ține de market, supermarket și cumpărături online
 * - Locuință: cheltuieli de utilități, chirii, rate imobiliare, renovări, mobilări
 * - Divertisment: restaurante, cafenele, cinema, evenimente
 * - Subscripții: Netflix, Spotify, abonamente software
 * - Educație: școală, cărți, cursuri online
 * - Venituri: salarii, freelance, dividende, bonusuri
 * - Transfer Intern: transferuri între propriile conturi (nu afectează bugetul)
 * - Transferuri: transferuri către/de la prieteni sau servicii externe
 * - Taxe și Impozite: taxe, impozite, amenzi
 * - Cash: retrageri de numerar
 */

export interface CategoryRule {
  categoryName: string;
  keywords: string[];
  description: string;
  icon?: string;
}

/**
 * REGULI DE CATEGORIZARE
 * Când descrierea tranzacției conține unul din cuvintele cheie,
 * tranzacția primește automat categoria corespunzătoare.
 */
export const CATEGORY_RULES: CategoryRule[] = [
  // IMPORTANT: Ordinea contează! Categoriile cu cuvinte cheie mai specifice trebuie să fie primele.

  // 1. TRANSPORT (Verificăm primul pentru a evita conflicte cu "bilet", "abonament")
  {
    categoryName: "Transport",
    description: "Transport în comun sau cheltuieli cu mijlocul personal de transport (benzină, service auto, taxi, Uber)",
    icon: "🚗",
    keywords: [
      // Benzinării România
      "petrom",
      "omv",
      "rompetrol",
      "mol",
      "lukoil",
      "socar",
      "benzinarie",
      // Transport public
      "metrorex",
      "ratb",
      "stb",
      "bilet metrou",
      "abonament transport",
      "transport",
      "transport for london",
      // Taxi & Ride-sharing
      "uber",
      "bolt",
      "taxi",
      "clever",
      "freenow",
      // Parcări
      "parcare",
      "parking",
      // Service auto
      "service auto",
      "vulcanizare",
      "spalatorie auto",
      "itp",
      "rca",
      "rovinieta",
      // Internațional
      "shell",
      "bp",
      "esso",
      "fuel",
      "gas station",
    ],
  },

  // 2. CUMPĂRĂTURI (Supermarketuri, magazine alimentare, online shopping, haine, electronice)
  {
    categoryName: "Cumpărături",
    description: "Tot ce ține de market, supermarket și cumpărături online (haine, electronice, mobilă)",
    icon: "🛍️",
    keywords: [
      // Supermarketuri
      "kaufland",
      "lidl",
      "carrefour",
      "mega image",
      "mega-image",
      "megaimage",
      "profi",
      "penny",
      "auchan",
      "cora",
      "hypermarket",
      "selgros",
      "metro",
      "la doi pasi",
      "fresh",
      "piata",
      "tesco",
      "sainsbury",
      "asda",
      "waitrose",
      "aldi",
      "grocery",
      "supermarket",
      "food",
      "market",
      // Fashion
      "zara",
      "h&m",
      "reserved",
      "pull bear",
      "bershka",
      "stradivarius",
      "mango",
      "c&a",
      "new yorker",
      "primark",
      // Online
      "emag",
      "amazon",
      "ebay",
      "fashion days",
      "answear",
      "about you",
      // Electronice
      "altex",
      "media galaxy",
      "flanco",
      "pcgarage",
      "apple store",
      "orange shop",
      // Mobilă & DIY
      "ikea",
      "jysk",
      "dedeman",
      "leroy merlin",
      "praktiker",
      "shopping",
      "mall",
    ],
  },

  // 2. TRANSPORT (Transport în comun sau cheltuieli cu mijlocul personal de transport)
  {
    categoryName: "Transport",
    description: "Transport în comun sau cheltuieli cu mijlocul personal de transport (benzină, service auto, taxi, Uber)",
    icon: "🚗",
    keywords: [
      // Benzinării România
      "petrom",
      "omv",
      "rompetrol",
      "mol",
      "lukoil",
      "socar",
      "benzinarie",
      // Transport public
      "metrorex",
      "ratb",
      "stb",
      "bilet",
      "abonament",
      "transport",
      "transport for london",
      // Taxi & Ride-sharing
      "uber",
      "bolt",
      "taxi",
      "clever",
      "freenow",
      // Parcări
      "parcare",
      "parking",
      // Service auto
      "service auto",
      "vulcanizare",
      "spalatorie auto",
      "itp",
      "rca",
      "rovinieta",
      // Internațional
      "shell",
      "bp",
      "esso",
      "fuel",
      "gas station",
    ],
  },

  // 3. LOCUINȚĂ (Cheltuieli de utilități, chirii, rate imobiliare, renovări, mobilări)
  {
    categoryName: "Locuință",
    description: "Cheltuieli de utilități, chirii, rate imobiliare, renovări, mobilări",
    icon: "🏠",
    keywords: [
      // Chirie & Rate
      "chirie",
      "rent",
      "rata",
      "credit imobiliar",
      "ipoteca",
      // Întreținere
      "intretinere",
      "intretinere bloc",
      "administrare",
      "asociatie",
      // Utilități - Energie
      "enel",
      "electrica",
      "energie",
      "curent",
      "gaz",
      "engie",
      "distrigaz",
      // Utilități - Apă
      "apa nova",
      "compania de apa",
      "canal",
      // Utilități - Internet & TV
      "digi",
      "rds",
      "upc",
      "telekom",
      "vodafone",
      "orange",
      "internet",
      "cablu tv",
      "telefon",
      "mobil",
      // Renovări & Reparații
      "reparatie",
      "instalator",
      "electrician",
      "zugravi",
      "amenajari",
      "renovare",
      // Internațional
      "electric",
      "electricity",
      "water",
      "utilities",
      "broadband",
      "housing",
      "maintenance",
    ],
  },

  // 4. SĂNĂTATE (Medicamente, investigații, consultații, intervenții)
  {
    categoryName: "Sănătate",
    description: "Medicamente, investigații, consultații, intervenții medicale",
    icon: "🏥",
    keywords: [
      // Farmacii România
      "catena",
      "help net",
      "sensiblu",
      "farmacia tei",
      "dona",
      "pharmacy",
      "farmacie",
      "medicamente",
      // Clinici & Medici
      "clinica",
      "spital",
      "medic",
      "doctor",
      "policlinica",
      "sanomed",
      "regina maria",
      "medicover",
      "medlife",
      "consultatie",
      "consult",
      "cabinet medical",
      // Analize & Investigații
      "synevo",
      "bioclinica",
      "analize",
      "laborator",
      "ecografie",
      "rmn",
      "ct",
      "radiografie",
      // Stomatologie
      "dentist",
      "stomatolog",
      "cabinet stomatologic",
      // Internațional
      "hospital",
      "medical",
      "health",
    ],
  },

  // 5. DIVERTISMENT (Restaurante, cafenele, baruri, cinema, evenimente)
  {
    categoryName: "Divertisment",
    description: "Restaurante, cafenele, baruri, cinema, evenimente, ieșiri în oraș",
    icon: "🍽️",
    keywords: [
      "restaurant",
      "pizzerie",
      "trattoria",
      "taverna",
      "bistro",
      "pub",
      "bar",
      "cafenea",
      "cafe",
      "coffee",
      "starbucks",
      "costa",
      "mccafe",
      "cinema",
      "cinematograf",
      "bilet film",
      "concert",
      "teatru",
      "eveniment",
      // Fast-food
      "mcdonald",
      "kfc",
      "burger king",
      "pizza hut",
      "subway",
      // Internațional
      "dining",
      "nando",
      "greggs",
    ],
  },

  // 6. SUBSCRIPȚII (Netflix, Spotify, abonamente software și servicii)
  {
    categoryName: "Subscripții",
    description: "Abonamente pentru streaming, software, servicii cloud, fitness",
    icon: "📺",
    keywords: [
      // Streaming
      "netflix",
      "hbo",
      "disney",
      "amazon prime",
      "spotify",
      "apple music",
      "youtube premium",
      "deezer",
      "tidal",
      // Software & Cloud
      "adobe",
      "microsoft 365",
      "office 365",
      "google one",
      "icloud",
      "dropbox",
      "notion",
      "canva",
      "github",
      // Gaming
      "playstation",
      "xbox",
      "steam",
      "epic games",
      // Fitness
      "worldclass",
      "fitness",
      "gym",
      // Generic
      "subscription",
      "abonament",
      "membership",
    ],
  },

  // 7. EDUCAȚIE (Școală, universitate, cărți, cursuri online)
  {
    categoryName: "Educație",
    description: "Școală, universitate, cărți, cursuri online, training-uri",
    icon: "📚",
    keywords: [
      "scoala",
      "universitate",
      "facultate",
      "curs",
      "training",
      "carte",
      "librarie",
      "carturesti",
      "humanitas",
      "udemy",
      "coursera",
      "skillshare",
      "educatie",
      "school",
      "education",
      "tuition",
      "books",
    ],
  },

  // 8. VENITURI (Salarii, freelance, dividende, bonusuri)
  {
    categoryName: "Venituri",
    description: "Salarii, freelance, dividende, bonusuri, venituri din diverse surse",
    icon: "💰",
    keywords: [
      "salariu",
      "salary",
      "venit",
      "income",
      "bonus",
      "premiu",
      "freelance",
      "dividende",
      "dobanda",
      "interest",
      "cashback",
      "rambursare",
      "refund",
    ],
  },

  // 9. TRANSFER INTERN (Transferuri între propriile conturi)
  {
    categoryName: "Transfer Intern",
    description: "Transferuri între propriile conturi (nu afectează bugetul total)",
    icon: "🔄",
    keywords: [
      // Română
      "transfer intern",
      "cont propriu",
      "între conturi",
      // Engleză
      "from savings",
      "to savings",
      "internal transfer",
      // Rusă (Revolut RU)
      "сбережения", // Savings
      "текущий", // Current
      "накопления", // Accumulation/Savings
      "в кошелек", // To wallet/pocket (către savings)
      "из eur", // From EUR (din cont EUR)
      "мгновенным доступом", // Instant access
      "from сбережения", // From Savings (mixed RU/EN)
    ],
  },

  // 10. TRANSFERURI (Transferuri externe - către/de la alte persoane)
  {
    categoryName: "Transferuri",
    description: "Transferuri către/de la prieteni, familie sau servicii de transfer",
    icon: "💸",
    keywords: [
      "transfer",
      "virament",
      "exchange",
      "schimb valutar",
      "revolut",
      "wise",
      "paypal",
      "money transfer",
    ],
  },

  // 11. TAXE ȘI IMPOZITE (Taxe, impozite, amenzi)
  {
    categoryName: "Taxe și Impozite",
    description: "Taxe, impozite, amenzi, penalități",
    icon: "🧾",
    keywords: [
      "impozit",
      "tax",
      "tva",
      "anaf",
      "fisc",
      "taxa",
      "amenda",
      "penalitate",
      "fine",
      "penalty",
    ],
  },

  // 12. CASH (Retrageri numerar)
  {
    categoryName: "Cash",
    description: "Retrageri de numerar de la ATM",
    icon: "💵",
    keywords: [
      "atm",
      "cash",
      "retragere",
      "withdrawal",
      "bancomat",
      "numerar",
    ],
  },
];

/**
 * FUNCȚIE: Categorizare automată pe bază de pattern matching
 *
 * @param description - Descrierea tranzacției (ex: "KAUFLAND BUCURESTI")
 * @returns Numele categoriei sau null dacă nu se găsește match
 */
export function autoCategorizeByCategoryName(description: string): string | null {
  if (!description) return null;

  const lowerDesc = description.toLowerCase();

  // Căutăm în toate regulile
  for (const rule of CATEGORY_RULES) {
    // Verificăm dacă descrierea conține vreun keyword
    for (const keyword of rule.keywords) {
      if (lowerDesc.includes(keyword.toLowerCase())) {
        return rule.categoryName;
      }
    }
  }

  return null; // Nu s-a găsit nicio potrivire
}

/**
 * FUNCȚIE: Returnează toate categoriile disponibile cu iconițe
 */
export function getAllCategories(): { name: string; icon: string; description: string }[] {
  return CATEGORY_RULES.map((rule) => ({
    name: rule.categoryName,
    icon: rule.icon || "📋",
    description: rule.description,
  }));
}
