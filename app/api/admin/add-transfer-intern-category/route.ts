/**
 * API ROUTE: Add Transfer Intern category to existing users
 *
 * IMPORTANT: One-time migration endpoint.
 * Usage: POST /api/admin/add-transfer-intern-category
 */

import { NextRequest, NextResponse } from "next/server";
import { createId } from "@paralleldrive/cuid2";
import { getSupabaseAuthContext } from "@/lib/supabase/auth-context";
import { requireAdminEmail } from "@/lib/auth/admin";

export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await getSupabaseAuthContext(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const adminCheck = requireAdminEmail(user.email);
    if (adminCheck) {
      return adminCheck;
    }

    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, email");

    if (usersError) {
      throw new Error(usersError.message);
    }

    const allUsers = users || [];
    let addedCount = 0;
    let skippedCount = 0;
    const results: Array<{
      email: string;
      status: "added" | "skipped";
      reason?: string;
    }> = [];

    for (const userRow of allUsers) {
      const { data: existingCategory, error: existingCategoryError } = await supabase
        .from("categories")
        .select("id")
        .eq("user_id", userRow.id)
        .eq("name", "Transfer Intern")
        .maybeSingle();

      if (existingCategoryError) {
        throw new Error(existingCategoryError.message);
      }

      if (existingCategory) {
        skippedCount++;
        results.push({
          email: userRow.email,
          status: "skipped",
          reason: "category already exists",
        });
        continue;
      }

      const { error: insertError } = await supabase.from("categories").insert({
        id: createId(),
        user_id: userRow.id,
        name: "Transfer Intern",
        type: "expense",
        color: "#10b981",
        icon: "🔄",
        description:
          "Transferuri între propriile conturi (nu afectează bugetul total)",
        is_system_category: true,
      });

      if (insertError) {
        throw new Error(insertError.message);
      }

      addedCount++;
      results.push({
        email: userRow.email,
        status: "added",
      });
    }

    return NextResponse.json({
      message: "Migration completed successfully",
      totalUsers: allUsers.length,
      categoriesAdded: addedCount,
      skipped: skippedCount,
      results,
    });
  } catch (error: any) {
    console.error("Add Transfer Intern category error:", error);
    return NextResponse.json(
      {
        error: "Migration failed",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
