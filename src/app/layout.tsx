import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import { Provider } from "@/components/ui/provider";
import { Header } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Toaster } from "@/components/ui/toaster";

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CricMatrix",
  description: "CricMatrix — plan and run cricket tournaments.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className={`${rubik.variable}`} lang="en" suppressHydrationWarning>
      <body>
        {/* Thin progress bar shown during route/page navigations. */}
        <NextTopLoader
          color="#3b82f6"
          height={3}
          showSpinner={false}
          shadow="0 0 10px #3b82f6, 0 0 5px #3b82f6"
        />
        <Provider>
          <Toaster />
          <Header />
          {children}
          <BottomNav />
        </Provider>
      </body>
    </html>
  );
}
