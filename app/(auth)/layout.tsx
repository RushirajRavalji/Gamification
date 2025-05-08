import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      <header className="py-6 px-4 flex justify-center">
        <Link href="/" className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-amber-500">
          Solo Legend
        </Link>
      </header>
      <main>{children}</main>
    </div>
  );
} 