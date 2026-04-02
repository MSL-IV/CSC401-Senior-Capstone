import { LoginPage } from "@/components/login";

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  const suspended = resolvedParams?.suspended === "1";

  return <LoginPage suspended={suspended} />;
}
