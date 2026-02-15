import type { SupabaseClient } from "@supabase/supabase-js";
import { createId } from "@paralleldrive/cuid2";

type CategoryType = "income" | "expense" | "savings";

interface DefaultSystemCategory {
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  description: string;
}

const DEFAULT_SYSTEM_CATEGORIES: DefaultSystemCategory[] = [
  { name: "Transport", type: "expense", icon: "🚗", color: "#06b6d4", description: "Transport în comun, taxi, rideshare, benzină, parcare, service auto." },
  { name: "Cumpărături", type: "expense", icon: "🛍️", color: "#ec4899", description: "Supermarket, cumpărături online, haine, electronice, mall." },
  { name: "Locuință", type: "expense", icon: "🏠", color: "#ef4444", description: "Chirie, utilități, întreținere, internet, renovări." },
  { name: "Sănătate", type: "expense", icon: "🏥", color: "#14b8a6", description: "Farmacie, consultații, investigații, servicii medicale." },
  { name: "Divertisment", type: "expense", icon: "🎉", color: "#8b5cf6", description: "Cinema, ieșiri, restaurante, cafenele, evenimente." },
  { name: "Subscripții", type: "expense", icon: "🎵", color: "#6366f1", description: "Abonamente recurente: streaming, software, servicii digitale." },
  { name: "Educație", type: "expense", icon: "📚", color: "#3b82f6", description: "Cursuri, cărți, școlarizare, certificări." },
  { name: "Venituri", type: "income", icon: "💰", color: "#10b981", description: "Salarii, bonusuri, freelance, dividende, alte intrări." },
  { name: "Transfer Intern", type: "expense", icon: "🔄", color: "#6366f1", description: "Mutări între conturile proprii (nu cheltuială reală)." },
  { name: "Transferuri", type: "expense", icon: "💸", color: "#f59e0b", description: "Transferuri către/de la alte persoane sau servicii externe." },
  { name: "Taxe și Impozite", type: "expense", icon: "📄", color: "#64748b", description: "Taxe, impozite, comisioane administrative, amenzi." },
  { name: "Cash", type: "expense", icon: "💵", color: "#84cc16", description: "Retrageri de numerar și operațiuni cash." },
];

export async function ensureDefaultSystemCategories(
  supabase: SupabaseClient,
  userId: string
) {
  const { data: existingCategories, error: existingCategoriesError } = await supabase
    .from("categories")
    .select("name")
    .eq("user_id", userId);

  if (existingCategoriesError) {
    throw new Error(existingCategoriesError.message);
  }

  const existingNames = new Set((existingCategories || []).map((category) => category.name));

  const missingCategories = DEFAULT_SYSTEM_CATEGORIES.filter(
    (category) => !existingNames.has(category.name)
  );

  if (missingCategories.length === 0) {
    return { inserted: 0 };
  }

  const rowsToInsert = missingCategories.map((category) => ({
    id: createId(),
    user_id: userId,
    name: category.name,
    type: category.type,
    icon: category.icon,
    color: category.color,
    description: category.description,
    is_system_category: true,
  }));

  const { error: insertError } = await supabase
    .from("categories")
    .insert(rowsToInsert);

  if (insertError) {
    throw new Error(insertError.message);
  }

  return { inserted: rowsToInsert.length };
}
