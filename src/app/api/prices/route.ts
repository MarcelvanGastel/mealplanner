import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { items } = (await request.json()) as { items: string[] };

  if (!items || items.length === 0) {
    return NextResponse.json({ error: "No items provided" }, { status: 400 });
  }

  // Search for each item across all supermarkets using text search
  const results: Record<
    string,
    Array<{
      supermarket_code: string;
      supermarket_name: string;
      product_name: string;
      price: number;
      amount: string | null;
      product_link: string | null;
    }>
  > = {};

  for (const item of items.slice(0, 50)) {
    // Max 50 items per request
    const searchTerm = item
      .replace(/\d+\s*(g|kg|ml|l|stuks?|el|tl)\b/gi, "") // strip amounts
      .trim();

    if (!searchTerm) continue;

    const { data, error } = await supabase
      .from("supermarket_products")
      .select(
        `
        product_name,
        price,
        amount,
        product_link,
        supermarket_code,
        supermarkets!inner(name)
      `
      )
      .textSearch("product_name", searchTerm.split(" ").join(" & "), {
        type: "plain",
        config: "dutch",
      })
      .order("price", { ascending: true })
      .limit(3); // top 3 cheapest per item

    if (!error && data) {
      results[item] = data.map((row: any) => ({
        supermarket_code: row.supermarket_code,
        supermarket_name: row.supermarkets?.name || row.supermarket_code,
        product_name: row.product_name,
        price: row.price,
        amount: row.amount,
        product_link: row.product_link,
      }));
    }
  }

  return NextResponse.json({ results });
}
