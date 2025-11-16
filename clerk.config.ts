import { ClerkMiddlewareOptions } from "@clerk/nextjs/server";

const clerkConfig: ClerkMiddlewareOptions = {
  afterSignInUrl: '/feed',
  afterSignUpUrl: '/feed',
  signInUrl: '/sign-in',
  signUpUrl: '/sign-up',
};

export default clerkConfig;


