import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import { Provider } from "@/components/ui/provider";
import { Header } from "@/components/layout/header";
import { TournamentProvider } from "@/contexts/tournament-context";
import { Toaster } from "@/components/ui/toaster";

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cricket Planner",
  description: "Cricket Planner",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className={`${rubik.variable}`} lang="en" suppressHydrationWarning>
      <body>
        <Provider>
          <TournamentProvider>
            <Toaster />
            <Header />
            {children}
          </TournamentProvider>
        </Provider>
      </body>
    </html>
  );
}
