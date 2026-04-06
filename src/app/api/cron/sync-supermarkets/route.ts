import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPERMARKETS_URL = "https://www.checkjebon.nl/data/supermarkets.json";
const BATCH_SIZE = 500; // upsert in batches

// Raw data types from checkjebon
interface RawProduct {
  n: string; // product name
  p: number; // price
  l?: string; // link (relative)
  s?: string; // size/amount
}

interface RawSupermarket {
  n: string; // code
  c: string; // display name
  i?: string; // icon url
  u?: string; // base url
  d: RawProduct[]; // products
}

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    console.log("[sync-supermarkets] Fetching data from checkjebon...");

    // 1. Fetch raw supermarket data
    const res = await fetch(SUPERMARKETS_URL, {
      headers: { "Accept-Encoding": "gzip" },
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
    }
    const rawData: RawSupermarket[] = await res.json();

    console.log(
      `[sync-supermarkets] Got ${rawData.length} supermarkets`
    );

    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    let totalProducts = 0;

    // 2. Upsert supermarkets
    const supermarkets = rawData.map((s) => ({
      code: s.n,
      name: s.c,
      icon_url: s.i || null,
      base_url: s.u || null,
      total_products: s.d?.length || 0,
      last_synced: new Date().toISOString(),
    }));

    const { error: smError } = await supabase
      .from("supermarkets")
      .upsert(supermarkets, { onConflict: "code" });

    if (smError) {
      throw new Error(`Supermarkets upsert failed: ${smError.message}`);
    }

    // 3. Delete old product data (keep only today)
    const { error: deleteError } = await supabase
      .from("supermarket_products")
      .delete()
      .neq("synced_date", today);

    if (deleteError) {
      console.warn(
        `[sync-supermarkets] Old data cleanup warning: ${deleteError.message}`
      );
    }

    // 4. Insert products per supermarket in batches
    for (const supermarket of rawData) {
      if (!supermarket.d || supermarket.d.length === 0) continue;

      const products = supermarket.d
        .filter((p) => p.n && p.p != null)
        .map((p) => ({
          supermarket_code: supermarket.n,
          product_name: p.n,
          price: Math.round(p.p * 100) / 100,
          amount: p.s || null,
          product_link: p.l ? (supermarket.u || "") + p.l : null,
          synced_date: today,
        }));

      // Upsert in batches
      for (let i = 0; i < products.length; i += BATCH_SIZE) {
        const batch = products.slice(i, i + BATCH_SIZE);
        const { error: batchError } = await supabase
          .from("supermarket_products")
          .upsert(batch, {
            onConflict: "supermarket_code,product_name,synced_date",
          });

        if (batchError) {
          console.error(
            `[sync-supermarkets] Batch error for ${supermarket.n}: ${batchError.message}`
          );
        }
      }

      totalProducts += products.length;
      console.log(
        `[sync-supermarkets] ${supermarket.c}: ${products.length} products synced`
      );
    }

    console.log(
      `[sync-supermarkets] Done! ${rawData.length} supermarkets, ${totalProducts} products total`
    );

    return NextResponse.json({
      success: true,
      supermarkets: rawData.length,
      products: totalProducts,
      date: today,
    });
  } catch (error) {
    console.error("[sync-supermarkets] Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
