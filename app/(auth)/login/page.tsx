import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/dal";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = { title: "Login — NoteShare" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  const { registered } = await searchParams;
  return <LoginForm justRegistered={registered === "1"} />;
}
