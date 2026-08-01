import { Be_Vietnam_Pro, Parkinsans } from "next/font/google";
import EmotionRegistry from "@/components/EmotionRegistry";
import "./globals.css";

const beVietnam = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const headingFont = Parkinsans({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-heading",
  display: "swap",
  adjustFontFallback: false,
});

export const metadata = {
  title: "SmartFM - Customer Portal",
  description: "B2B Order Placement & Tracking System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${beVietnam.className} ${headingFont.variable} min-h-full flex flex-col bg-slate-50 text-slate-800 antialiased`}
      >
        <EmotionRegistry>{children}</EmotionRegistry>
      </body>
    </html>
  );
}
