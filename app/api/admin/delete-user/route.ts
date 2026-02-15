/**
 * API ROUTE: Delete User Account
 *
 * IMPORTANT: This permanently deletes a user and ALL associated data.
 * Usage: DELETE /api/admin/delete-user?email=user@example.com
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAuthContext } from "@/lib/supabase/auth-context";
import { requireAdminEmail } from "@/lib/auth/admin";

export async function DELETE(request: NextRequest) {
  try {
    const { supabase, user } = await getSupabaseAuthContext(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const adminCheck = requireAdminEmail(user.email);
    if (adminCheck) {
      return adminCheck;
    }

    const { searchParams } = new URL(request.url);
    const emailToDelete = searchParams.get("email");

    if (!emailToDelete) {
      return NextResponse.json(
        { error: "Email parameter is required" },
        { status: 400 }
      );
    }

    const { data: userToDelete, error: userError } = await supabase
      .from("users")
      .select("id, email")
      .eq("email", emailToDelete)
      .maybeSingle();

    if (userError) {
      throw new Error(userError.message);
    }

    if (!userToDelete) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = userToDelete.id;

    const [categoriesResult, transactionsResult, banksResult] = await Promise.all([
      supabase.from("categories").select("id", { count: "exact", head: true }).eq("user_id", userId),
      supabase.from("transactions").select("id", { count: "exact", head: true }).eq("user_id", userId),
      supabase.from("banks").select("id", { count: "exact", head: true }).eq("user_id", userId),
    ]);

    if (categoriesResult.error || transactionsResult.error || banksResult.error) {
      throw new Error(
        categoriesResult.error?.message ||
          transactionsResult.error?.message ||
          banksResult.error?.message ||
          "Nu s-a putut calcula datele asociate"
      );
    }

    const { error: deleteUserError } = await supabase
      .from("users")
      .delete()
      .eq("id", userId);

    if (deleteUserError) {
      throw new Error(deleteUserError.message);
    }

    return NextResponse.json({
      message: "User deleted successfully",
      email: emailToDelete,
      deletedData: {
        categories: categoriesResult.count || 0,
        transactions: transactionsResult.count || 0,
        banks: banksResult.count || 0,
      },
    });
  } catch (error: any) {
    console.error("Delete user error:", error);
    return NextResponse.json(
      {
        error: "Failed to delete user",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
