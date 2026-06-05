"use client";

export default function GreetingBanner({ fullName, email }: { fullName: string; email?: string }) {
  return (
    <div className="mb-8 flex w-full flex-col items-start rounded-2xl bg-gradient-to-r from-emerald-800 to-emerald-600 px-4 py-6 shadow-lg sm:px-6 sm:py-8">
      <h1 className="text-2xl font-extrabold leading-tight text-white sm:text-3xl md:text-4xl">
        Welcome back,
        <br />
        <span className="inline-flex items-center text-amber-300">
          {fullName || "User"} <span className="ml-2">🎉</span>
        </span>
      </h1>
      {email && (
        <p className="mt-2 text-sm text-emerald-100/90 sm:text-base">{email}</p>
      )}
    </div>
  );
}
