// app/reset-password/page.tsx
// Server component: reads the token (or error) that BetterAuth appended to the
// callback URL and hands it to the client form. Reading searchParams here keeps
// us off useSearchParams, so no client Suspense boundary is needed.
import { ResetPasswordForm } from "./reset-password-form";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { token, error } = await searchParams;
  return <ResetPasswordForm token={token ?? null} tokenError={error ?? null} />;
}
