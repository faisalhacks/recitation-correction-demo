import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, Amiri, Noto_Sans_Arabic } from "next/font/google";
import "./globals.css";

// IBM Plex Sans over the usual Inter/Geist default: it holds up at the 11–12px
// label sizes this UI leans on, and its humanist structure sits beside Amiri
// without either face looking borrowed. It now carries only Latin runs — the
// participant names and timers that stay in Latin script inside Arabic rows.
const plex = IBM_Plex_Sans({
  variable: "--font-plex",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

// Amiri is reserved for Quran text and nothing else. It is a Naskh face cut
// after the Bulaq mushaf, so a button wearing it would read as scripture.
const amiri = Amiri({
  variable: "--font-amiri",
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  display: "swap",
});

// Every other Arabic glyph in the app — buttons, names, labels, the meeting
// chrome. Android has no Arabic in Roboto and falls back to exactly this face,
// so it is also what the screenshots we are cloning were actually rendered in.
const notoArabic = Noto_Sans_Arabic({
  variable: "--font-noto-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "تصحيح التلاوة — نموذج أولي",
  description:
    "نموذج أولي لتعليم أخطاء التلاوة كلمةً كلمةً في حلقات التلاوة المباشرة. غير تابع لأي جهة.",
};

export const viewport: Viewport = {
  themeColor: "#07100d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  // `dir` is a static attribute, never toggled after mount: flipping direction
  // in an effect would paint the whole app LTR for a frame and then snap.
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${plex.variable} ${amiri.variable} ${notoArabic.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
