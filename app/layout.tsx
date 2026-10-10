import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, Amiri } from "next/font/google";
import "./globals.css";

// IBM Plex Sans over the usual Inter/Geist default: it holds up at the 11–12px
// label sizes this UI leans on, and its humanist structure sits beside Amiri
// without either face looking borrowed.
const plex = IBM_Plex_Sans({
  variable: "--font-plex",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const amiri = Amiri({
  variable: "--font-amiri",
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Recitation Correction Demo",
  description:
    "A concept demo of word-by-word mistake marking for live Quran recitation sessions. Not affiliated with any organisation.",
};

export const viewport: Viewport = {
  themeColor: "#07100d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${plex.variable} ${amiri.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
