import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "product-images";
const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(req: Request) {
  try {
    await requireRole(["admin"]);
  } catch {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Fichier requis" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image trop volumineuse (max 5 Mo)" }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeExt = ["jpg", "jpeg", "png", "webp", "gif"].includes(ext) ? ext : "jpg";
  const path = `products/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${safeExt}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const sb = createAdminClient();
  const { error } = await sb.storage.from(BUCKET).upload(path, buffer, {
    contentType: file.type || `image/${safeExt}`,
    upsert: false,
  });

  if (error) {
    return NextResponse.json(
      {
        error:
          "Upload impossible. Créez le bucket Supabase « product-images » (public) puis réessayez.",
        detail: error.message,
      },
      { status: 500 },
    );
  }

  const { data: urlData } = sb.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({ url: urlData.publicUrl });
}
