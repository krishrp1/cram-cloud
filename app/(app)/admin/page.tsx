import { Settings } from "lucide-react";
import { requireAdmin } from "@/lib/auth/dal";
import { listAllPdfs } from "@/lib/data/pdfs";
import { listAllUsers } from "@/lib/data/users";
import { AdminTabs } from "@/components/admin/admin-tabs";

export const metadata = { title: "Admin Panel — Cram Cloud" };

export default async function AdminPage() {
  const admin = await requireAdmin();
  const [pdfs, users] = await Promise.all([listAllPdfs(), listAllUsers()]);

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <h1 className="font-heading flex items-center gap-2 text-2xl font-bold">
          <Settings className="text-cta size-6" aria-hidden />
          Admin Panel
        </h1>
        <p className="text-muted-foreground text-sm">Manage notes and users</p>
      </div>
      <AdminTabs pdfs={pdfs} users={users} currentUserId={admin.id} />
    </div>
  );
}
