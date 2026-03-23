import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "../../../lib/supabaseServer";
import { ADMIN_COOKIE_NAME } from "../../../lib/adminAuth";
import AdminLotsList from "../../../components/AdminLotsList";

export const dynamic = "force-dynamic";

export default async function AdminLotsPage() {
  const cookieStore = await cookies();
  const isAuthed = cookieStore.get(ADMIN_COOKIE_NAME)?.value === "1";

  if (!isAuthed) {
    redirect("/admin");
  }

  const supabase = createSupabaseServerClient();
  const { data: lots, error } = await supabase
    .from("lots")
    .select("id, title, slug, image_url, avito_link, current_price, min_step, delivery_price, end_time, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (
    <main className="container">
      <div className="card stack">
        <div className="row-between">
          <h1>Список лотов</h1>
          <Link className="button" href="/admin">
            Создать лот
          </Link>
        </div>
        <AdminLotsList initialLots={lots || []} />
      </div>
    </main>
  );
}
