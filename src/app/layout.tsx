import type { Metadata } from "next";
import { Archivo, Rubik } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import { Provider } from "@/components/ui/provider";
import { Header } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Toaster } from "@/components/ui/toaster";

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin"],
});

// Sporty grotesque for headings & scores. Heavy weights carry the matchday feel.
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
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
    <html
      className={`${rubik.variable} ${archivo.variable}`}
      lang="en"
      suppressHydrationWarning
    >
      <body>
        {/* Thin progress bar shown during route/page navigations. */}
        <NextTopLoader
          color="#9E2B44"
          height={3}
          showSpinner={false}
          shadow="0 0 10px #9E2B44, 0 0 5px #9E2B44"
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
