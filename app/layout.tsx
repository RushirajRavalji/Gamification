import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { FirebaseProvider } from "./firebase-provider";
// Temporarily comment out until the package is properly installed
// import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Solo Legend: Your Hero's Journey to Peak Body & Mind",
  description: "Turn your real-world fitness, health, and career goals into an RPG-style adventure.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <FirebaseProvider>
        {children}
        </FirebaseProvider>
        {/* Temporarily comment out until the package is properly installed */}
        {/* <Toaster position="bottom-right" /> */}
      </body>
    </html>
  );
}
