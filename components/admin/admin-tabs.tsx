"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, FolderOpen, Upload, Users } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { UploadForm } from "@/components/admin/upload-form";
import { PdfTable } from "@/components/admin/pdf-table";
import { UserTable } from "@/components/admin/user-table";
import type { PdfListItem } from "@/lib/data/pdfs";
import type { UserListItem } from "@/lib/data/users";

function Pagination({ tab, param, pages, currentPage }: { tab: string; param: string; pages: number; currentPage: number }) {
  if (pages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-center gap-3">
      {currentPage > 1 && (
        <Link
          href={`/admin?tab=${tab}&${param}=${currentPage - 1}`}
          className="hover:bg-accent inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm transition-colors"
        >
          <ChevronLeft className="size-4" aria-hidden />
          Prev
        </Link>
      )}
      <span className="text-muted-foreground text-sm">
        Page {currentPage} of {pages}
      </span>
      {currentPage < pages && (
        <Link
          href={`/admin?tab=${tab}&${param}=${currentPage + 1}`}
          className="hover:bg-accent inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm transition-colors"
        >
          Next
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      )}
    </div>
  );
}

export function AdminTabs({
  tab,
  pdfResult,
  userResult,
  currentUserId,
}: {
  tab: "upload" | "pdfs" | "users";
  pdfResult: { pdfs: PdfListItem[]; total: number; pages: number; currentPage: number };
  userResult: { users: UserListItem[]; total: number; pages: number; currentPage: number };
  currentUserId: number;
}) {
  return (
    <Tabs defaultValue={tab}>
      <TabsList>
        <TabsTrigger value="upload">
          <Upload className="size-4" aria-hidden />
          Upload PDF
        </TabsTrigger>
        <TabsTrigger value="pdfs">
          <FolderOpen className="size-4" aria-hidden />
          Manage PDFs
        </TabsTrigger>
        <TabsTrigger value="users">
          <Users className="size-4" aria-hidden />
          Manage Users
        </TabsTrigger>
      </TabsList>

      <TabsContent value="upload" className="mt-4">
        <div className="bg-card ring-foreground/10 rounded-xl p-5 ring-1">
          <h2 className="mb-4 text-base font-semibold">Upload New PDF</h2>
          <UploadForm />
        </div>
      </TabsContent>

      <TabsContent value="pdfs" className="mt-4">
        <div className="bg-card ring-foreground/10 rounded-xl p-5 ring-1">
          <h2 className="mb-4 text-base font-semibold">All PDFs ({pdfResult.total})</h2>
          <PdfTable pdfs={pdfResult.pdfs} />
          <Pagination tab="pdfs" param="pdfsPage" pages={pdfResult.pages} currentPage={pdfResult.currentPage} />
        </div>
      </TabsContent>

      <TabsContent value="users" className="mt-4">
        <div className="bg-card ring-foreground/10 rounded-xl p-5 ring-1">
          <h2 className="mb-4 text-base font-semibold">All Users ({userResult.total})</h2>
          <UserTable users={userResult.users} currentUserId={currentUserId} />
          <Pagination tab="users" param="usersPage" pages={userResult.pages} currentPage={userResult.currentPage} />
        </div>
      </TabsContent>
    </Tabs>
  );
}
