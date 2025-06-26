"use client";
import { useSession } from "next-auth/react";

export default function GreetingBanner() {
  const { data: session } = useSession();
  if (!session?.user?.name) return null;
  const firstName = session.user.name.split(" ")[0];
  return (
    <div className="w-full bg-indigo-50 text-indigo-800 text-center py-2 font-semibold text-base shadow-sm">
      Hello {firstName}, you are welcome
    </div>
  );
} 