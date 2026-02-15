/**
 * API ROUTE: CURRENCIES/[ID]
 */

import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { eq, and } from "drizzle-orm";

/**
 * DELETE /api/currencies/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Neautentificat" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // SHARED MODE: Verificăm doar că valuta există (fără verificare ownership)
    const currencies = await db
      .select()
      .from(schema.currencies)
      .where(eq(schema.currencies.id, id));

    if (currencies.length === 0) {
      return NextResponse.json(
        { error: "Valuta nu există" },
        { status: 404 }
      );
    }

    await db
      .delete(schema.currencies)
      .where(eq(schema.currencies.id, id));

    return NextResponse.json({ message: "Valută ștearsă cu succes" });
  } catch (error) {
    console.error("Delete currency error:", error);
    return NextResponse.json(
      { error: "Eroare la ștergerea valutei" },
      { status: 500 }
    );
  }
}
