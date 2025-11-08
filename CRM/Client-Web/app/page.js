export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-black">
      <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-100">
        Welcome to Service365 CRM
      </h1>
      <p className="text-zinc-600 dark:text-zinc-400 mt-2 text-center">
        Smart AI-powered CRM. Automate your sales, calls, meetings and
        messaging.
      </p>

      <a
        href="/dashboard"
        className="mt-6 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition"
      >
        Go to Dashboard
      </a>
    </div>
  );
}
