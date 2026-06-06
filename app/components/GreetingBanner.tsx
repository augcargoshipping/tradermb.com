"use client";

import type { ReactNode } from "react";

export default function GreetingBanner({
  fullName,
  email,
  action,
}: {
  fullName: string;
  email?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
          Dashboard
        </p>
        <h1 className="mt-1 truncate text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
          {fullName || "Trader"}
        </h1>
        {email && (
          <p className="mt-1 truncate text-sm text-slate-500">{email}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
