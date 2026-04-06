import { redirect } from "next/navigation";

/**
 * Legacy Clerk sign-in page — now redirects to custom login.
 * Original archived at: src/legacy/clerk/sign-in-page.tsx
 */
export default function SignInPage() {
  redirect("/login");
}
