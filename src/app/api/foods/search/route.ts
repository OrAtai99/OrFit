import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface OFFNutriments {
  "energy-kcal_100g"?: number;
  proteins_100g?: number;
  carbohydrates_100g?: number;
  fat_100g?: number;
  sugars_100g?: number;
  fiber_100g?: number;
  sodium_100g?: number;
}

interface OFFProduct {
  code?: string;
  product_name?: string;
  product_name_he?: string;
  brands?: string;
  image_thumb_url?: string;
  image_small_url?: string;
  nutriments?: OFFNutriments;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const lang = /[֐-׿]/.test(q) ? "he" : "en";
  const params = new URLSearchParams({
    search_terms: q,
    search_simple: "1",
    action: "process",
    json: "1",
    page_size: "20",
    lc: lang,
    fields:
      "code,product_name,product_name_he,brands,image_thumb_url,image_small_url,nutriments",
  });

  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?${params}`,
      { headers: { "User-Agent": "OrFit/1.0 (oratai12380@gmail.com)" } }
    );
    if (!res.ok) {
      return NextResponse.json({ error: `OFF ${res.status}`, results: [] }, { status: 200 });
    }
    const data = await res.json();
    const results = ((data.products ?? []) as OFFProduct[])
      .filter((p) => p.nutriments?.["energy-kcal_100g"])
      .map((p) => ({
        code: p.code ?? "",
        name: p.product_name_he || p.product_name || "ללא שם",
        brand: p.brands ?? "",
        image: p.image_small_url || p.image_thumb_url || null,
        per100g: {
          calories: p.nutriments?.["energy-kcal_100g"] ?? 0,
          protein: p.nutriments?.proteins_100g ?? 0,
          carbs: p.nutriments?.carbohydrates_100g ?? 0,
          fat: p.nutriments?.fat_100g ?? 0,
        },
      }))
      .slice(0, 15);

    return NextResponse.json({ results });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "fetch failed", results: [] },
      { status: 200 }
    );
  }
}
