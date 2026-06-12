import { getCurrentUser } from "@/lib/auth";
import { AuthScreen } from "@/components/AuthScreen";
import { AppShell } from "@/components/AppShell";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getCurrentUser();
  if (!user) return <AuthScreen />;
  return <AppShell />;
}
