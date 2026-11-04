import LoginScreen from "@/components/LoginScreen";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const { notice } = await searchParams;
  return <LoginScreen notice={notice} />;
}
