import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";
import { IMPORT_TEMPLATE } from "@/lib/csv";

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  return new NextResponse(`\uFEFF${IMPORT_TEMPLATE}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="plantilla-productos.csv"',
      "Cache-Control": "no-store",
    },
  });
}
