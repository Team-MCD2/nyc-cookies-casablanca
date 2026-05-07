import { NextResponse } from "next/server";
import { listActiveProducts } from "@/lib/queries";

export async function GET() {
  try {
    const products = await listActiveProducts();
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}
