import { requireUser } from "@/lib/auth/dal";
import { listPdfsForUser } from "@/lib/data/pdfs";
import { PdfSidebar } from "@/components/dashboard/pdf-sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const pdfs = await listPdfsForUser(user);

  return (
    <div className="flex min-h-[calc(100svh-56px)] flex-col md:flex-row">
      <PdfSidebar pdfs={pdfs} isAdmin={user.role === "admin"} />
      <div className="flex flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  );
}
