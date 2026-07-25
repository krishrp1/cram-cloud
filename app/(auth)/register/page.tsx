import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/dal";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata = { title: "Register — NoteShare" };

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return <RegisterForm />;
}
