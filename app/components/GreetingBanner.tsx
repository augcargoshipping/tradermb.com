"use client";

export default function GreetingBanner({ fullName }: { fullName: string }) {
  return (
    <div className="w-full rounded-2xl mb-8 px-6 py-8 bg-gradient-to-r from-blue-800 to-purple-700 flex flex-col items-start shadow-lg">
      <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
        Welcome back,<br />
        <span className="text-yellow-300 inline-flex items-center">{fullName || "User"} <span className="ml-2">🎉</span></span>
      </h1>
    </div>
  );
} 