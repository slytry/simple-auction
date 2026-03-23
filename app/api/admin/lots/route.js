import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../lib/supabaseServer";
import { ADMIN_COOKIE_NAME } from "../../../../lib/adminAuth";

function randomSlug() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 10);
}

function validatePayload(body) {
  const requiredStrings = ["title", "image_url", "avito_link", "end_time"];

  for (const key of requiredStrings) {
    if (!body[key] || typeof body[key] !== "string") {
      return `Поле ${key} обязательно`;
    }
  }

  if (Number(body.start_price) < 0) return "Стартовая цена должна быть >= 0";
  if (Number(body.min_step) <= 0) return "Минимальный шаг должен быть > 0";
  if (Number(body.delivery_price || 0) < 0) return "Цена доставки должна быть >= 0";

  const endTime = new Date(body.end_time);
  if (Number.isNaN(endTime.getTime())) return "Некорректное время окончания";
  if (endTime.getTime() <= Date.now()) return "Время окончания должно быть в будущем";

  return null;
}

export async function POST(request) {
  const cookieStore = await cookies();
  if (cookieStore.get(ADMIN_COOKIE_NAME)?.value !== "1") {
    return NextResponse.json({ error: "Нет доступа" }, { status: 401 });
  }

  const body = await request.json();
  const validationError = validatePayload(body);

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();

  for (let attempts = 0; attempts < 5; attempts += 1) {
    const slug = randomSlug();

    const { data, error } = await supabase
      .from("lots")
      .insert({
        title: body.title.trim(),
        image_url: body.image_url.trim(),
        avito_link: body.avito_link.trim(),
        start_price: Number(body.start_price),
        current_price: Number(body.start_price),
        min_step: Number(body.min_step),
        delivery_price: Number(body.delivery_price || 0),
        end_time: new Date(body.end_time).toISOString(),
        slug
      })
      .select("slug")
      .single();

    if (!error) {
      return NextResponse.json({ slug: data.slug });
    }

    if (error.code !== "23505") {
      return NextResponse.json({ error: "Ошибка сервера при создании лота" }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Не удалось сгенерировать уникальную ссылку" }, { status: 500 });
}
