"use client"

import { Suspense } from "react";
import { SignUp } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";

function SignUpContent() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect_url') || '/dashboard';

  return (
    <SignUp 
      afterSignUpUrl={redirectUrl}
      fallbackRedirectUrl={redirectUrl}
      signInUrl="/sign-in"
      appearance={{
        elements: {
          rootBox: "mx-auto",
          card: "bg-gray-800/50 backdrop-blur-lg border border-gray-700",
        },
      }}
    />
  );
}

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-emerald-900">
      <div className="w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">SmartBin</h1>
          <p className="text-gray-400">Join our Smart Waste Management System</p>
        </div>
        <Suspense fallback={
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        }>
          <SignUpContent />
        </Suspense>
      </div>
    </div>
  );
}
