import Link from "next/link";

export const metadata = {
  title: "Configuration - WorkOn",
};

export default function SetupPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-2xl font-bold">WorkOn</h1>
        <p className="text-white/60">
          L&apos;application est prête. Connectez-vous ou créez un compte.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/login" className="text-red-accent hover:underline">Connexion</Link>
          <Link href="/register" className="text-red-accent hover:underline">Inscription</Link>
        </div>
      </div>
    </main>
  );
}
