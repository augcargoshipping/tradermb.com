"use client";
import type { ReactNode } from "react";
import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { AddToHomeScreenPrompt } from "@/components/site/add-to-home-screen-prompt";

export default function Providers({
  children,
  session,
}: {
  children: ReactNode;
  session?: Session | null;
}) {
  return (
    <SessionProvider
      session={session}
      refetchOnWindowFocus={false}
      refetchInterval={0}
    >
      {children}
      <AddToHomeScreenPrompt />
    </SessionProvider>
  );
} 