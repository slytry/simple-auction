import { cookies } from "next/headers";
import AdminLoginForm from "../../components/AdminLoginForm";
import AdminCreateLotForm from "../../components/AdminCreateLotForm";
import { ADMIN_COOKIE_NAME } from "../../lib/adminAuth";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const isAuthed = cookieStore.get(ADMIN_COOKIE_NAME)?.value === "1";

  return (
    <main className="container">
      <div className="card">{isAuthed ? <AdminCreateLotForm /> : <AdminLoginForm />}</div>
    </main>
  );
}
