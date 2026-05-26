import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";

export const metadata = {
  title: "Muqorrib Qurban — Sistem Manajemen Qurban",
  description:
    "Aplikasi web manajemen qurban digital untuk mengelola data muqorrib, hewan qurban, perolehan daging, mustahiq, dan panitia.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="antialiased">
        <div className="flex h-screen w-screen overflow-hidden islamic-pattern">
          <Sidebar />
          <main className="flex-1 min-w-0 overflow-hidden relative bg-bg-primary">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
