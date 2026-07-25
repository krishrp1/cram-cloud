"use client";

import { useTransition } from "react";
import { deleteUserAction } from "@/lib/actions/users";
import type { UserListItem } from "@/lib/data/users";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function DeleteButton({ userId }: { userId: number }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      size="sm"
      variant="destructive"
      disabled={pending}
      onClick={() => {
        if (!confirm("Delete this user? This cannot be undone.")) return;
        startTransition(() => {
          deleteUserAction(String(userId));
        });
      }}
    >
      {pending ? "Deleting…" : "Delete"}
    </Button>
  );
}

export function UserTable({ users, currentUserId }: { users: UserListItem[]; currentUserId: number }) {
  if (users.length === 0) {
    return <div className="p-8 text-center text-sm text-muted-foreground">No users found.</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Semester</TableHead>
          <TableHead>Joined</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((u) => (
          <TableRow key={u.id}>
            <TableCell>{u.email}</TableCell>
            <TableCell>
              <Badge variant={u.role === "admin" ? "default" : "secondary"} className="uppercase">
                {u.role}
              </Badge>
            </TableCell>
            <TableCell>{u.semester}</TableCell>
            <TableCell>{formatDate(u.createdAt)}</TableCell>
            <TableCell>
              {u.id === currentUserId ? (
                <span className="text-sm text-muted-foreground">You</span>
              ) : (
                <DeleteButton userId={u.id} />
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
