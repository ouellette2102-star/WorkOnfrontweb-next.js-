import Link from "next/link";
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="grid min-h-screen grid-cols-1 bg-neutral-950 text-white md:grid-cols-2">
      <div className="flex flex-col justify-between border-b border-white/5 p-8 md:border-b-0 md:border-r">
        <div className="space-y-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white">
            ← Retour à l’accueil
          </Link>
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-red-500">WorkOn</p>
            <h1 className="mt-3 text-4xl font-semibold md:text-5xl">Connexion</h1>
            <p className="mt-4 text-white/70">
              Accède à ton dashboard, suis tes missions en temps réel et partage ta progression sur le fil WorkOn.
            </p>
          </div>
        </div>
        <div className="hidden text-sm text-white/50 md:block">
          Bientôt disponibles : profils Worker, Employeur et Client résidentiel.
        </div>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-neutral-900/70 p-4 shadow-2xl shadow-black/50 backdrop-blur">
          <SignIn
            appearance={{
              elements: {
                card: "bg-transparent shadow-none",
                formButtonPrimary: "bg-red-600 hover:bg-red-500 text-sm h-11",
                headerTitle: "text-2xl font-semibold",
                headerSubtitle: "text-white/70",
              },
            }}
            routing="path"
            path="/sign-in"
            signUpUrl="/sign-up"
            redirectUrl="/feed"
            afterSignInUrl="/feed"
          />
        </div>
      </div>
    </div>
  );
}

