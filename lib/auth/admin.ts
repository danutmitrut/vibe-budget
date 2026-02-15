import { NextResponse } from "next/server";

export function requireAdminEmail(email: string | null | undefined) {
  const configuredAdmins = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

  if (configuredAdmins.length === 0) {
    return NextResponse.json(
      {
        error: "Admin routes disabled",
        code: "E_ADMIN_NOT_CONFIGURED",
      },
      { status: 403 }
    );
  }

  const normalizedEmail = (email || "").toLowerCase();
  if (!configuredAdmins.includes(normalizedEmail)) {
    return NextResponse.json(
      {
        error: "Forbidden",
        code: "E_ADMIN_FORBIDDEN",
      },
      { status: 403 }
    );
  }

  return null;
}
