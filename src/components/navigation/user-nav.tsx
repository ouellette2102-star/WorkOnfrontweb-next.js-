import Link from 'next/link';
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from '@clerk/nextjs';
import { Button } from '@/components/ui/button';

export function UserNav() {
  return (
    <div className="flex items-center gap-3 text-sm">
      <SignedOut>
        <SignInButton mode="modal">
          <Button variant="ghost" size="sm">
            Connexion
          </Button>
        </SignInButton>
        <SignUpButton mode="modal">
          <Button size="sm">S&apos;inscrire</Button>
        </SignUpButton>
      </SignedOut>

      <SignedIn>
        <Link
          href="/dashboard"
          className="rounded-full border border-white/15 px-4 py-1.5 text-white/80 transition hover:text-white"
        >
          Dashboard
        </Link>
        <UserButton
          appearance={{
            elements: {
              userButtonPopoverCard: 'bg-neutral-900 border border-white/10 text-white',
            },
          }}
          afterSignOutUrl="/"
        />
      </SignedIn>
    </div>
  );
}


