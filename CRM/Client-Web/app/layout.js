import "./globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100">
        <header className="w-full py-4 px-6 flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800">
          <h1 className="font-bold text-lg">Service365 CRM</h1>

          <nav className="flex gap-4 text-sm">
            <a href="/" className="hover:text-indigo-600">Home</a>
            <a href="/dashboard" className="hover:text-indigo-600 font-medium">
              Dashboard
            </a>
          </nav>
        </header>

        <main className="pt-4">{children}</main>
      </body>
    </html>
  );
}
