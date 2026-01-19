/**
 * API ROUTE: Delete User Account
 *
 * IMPORTANT: This permanently deletes a user and ALL associated data
 * - User record
 * - All categories (cascade)
 * - All transactions (cascade)
 * - All banks (cascade)
 * - All user keywords (cascade)
 *
 * Usage: DELETE /api/admin/delete-user?email=user@example.com
 */

import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function DELETE(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const emailToDelete = searchParams.get("email");

    if (!emailToDelete) {
      return NextResponse.json(
        { error: "Email parameter is required" },
        { status: 400 }
      );
    }

    console.log(`🗑️  Attempting to delete user: ${emailToDelete}`);

    // Find the user
    const userToDelete = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, emailToDelete))
      .limit(1);

    if (userToDelete.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const userId = userToDelete[0].id;

    // Count associated data before deletion
    const categories = await db
      .select()
      .from(schema.categories)
      .where(eq(schema.categories.userId, userId));

    const transactions = await db
      .select()
      .from(schema.transactions)
      .where(eq(schema.transactions.userId, userId));

    const banks = await db
      .select()
      .from(schema.banks)
      .where(eq(schema.banks.userId, userId));

    console.log(`📊 User has:`);
    console.log(`   - ${categories.length} categories`);
    console.log(`   - ${transactions.length} transactions`);
    console.log(`   - ${banks.length} banks`);

    // Delete the user (cascade will delete all associated data)
    await db.delete(schema.users).where(eq(schema.users.id, userId));

    console.log(`✅ User ${emailToDelete} deleted successfully`);

    return NextResponse.json({
      message: "User deleted successfully",
      email: emailToDelete,
      deletedData: {
        categories: categories.length,
        transactions: transactions.length,
        banks: banks.length,
      },
    });
  } catch (error: any) {
    console.error("❌ Delete user error:", error);
    return NextResponse.json(
      {
        error: "Failed to delete user",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
