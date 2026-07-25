"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { UploadForm } from "@/components/admin/upload-form";
import { PdfTable } from "@/components/admin/pdf-table";
import { UserTable } from "@/components/admin/user-table";
import type { PdfListItem } from "@/lib/data/pdfs";
import type { UserListItem } from "@/lib/data/users";

export function AdminTabs({
  pdfs,
  users,
  currentUserId,
}: {
  pdfs: PdfListItem[];
  users: UserListItem[];
  currentUserId: number;
}) {
  return (
    <Tabs defaultValue="upload">
      <TabsList>
        <TabsTrigger value="upload">📤 Upload PDF</TabsTrigger>
        <TabsTrigger value="pdfs">📂 Manage PDFs</TabsTrigger>
        <TabsTrigger value="users">👥 Manage Users</TabsTrigger>
      </TabsList>

      <TabsContent value="upload" className="mt-4">
        <div className="rounded-lg border bg-muted/30 p-5">
          <h2 className="mb-4 text-base font-semibold">Upload New PDF</h2>
          <UploadForm />
        </div>
      </TabsContent>

      <TabsContent value="pdfs" className="mt-4">
        <div className="rounded-lg border bg-muted/30 p-5">
          <h2 className="mb-4 text-base font-semibold">All PDFs</h2>
          <PdfTable pdfs={pdfs} />
        </div>
      </TabsContent>

      <TabsContent value="users" className="mt-4">
        <div className="rounded-lg border bg-muted/30 p-5">
          <h2 className="mb-4 text-base font-semibold">All Users</h2>
          <UserTable users={users} currentUserId={currentUserId} />
        </div>
      </TabsContent>
    </Tabs>
  );
}
