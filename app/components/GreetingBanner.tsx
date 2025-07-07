"use client";

export default function GreetingBanner({ fullName, email }: { fullName: string; email?: string }) {
  return (
    <div className="w-full rounded-2xl mb-8 px-4 sm:px-6 py-6 sm:py-8 bg-gradient-to-r from-blue-800 to-purple-700 flex flex-col items-start shadow-lg">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white leading-tight">
        Welcome back,<br />
        <span className="text-yellow-300 inline-flex items-center">{fullName || "User"} <span className="ml-2">🎉</span></span>
      </h1>
      {email && (
        <p className="text-sm sm:text-base text-blue-100 mt-2 opacity-90">
          {email}
        </p>
      )}
    </div>
  );
} 