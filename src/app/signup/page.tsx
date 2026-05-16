"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SignupRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login?type=signup");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="animate-pulse text-slate-400 font-medium">Redirecting...</div>
    </div>
  );
}
