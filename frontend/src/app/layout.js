import { Be_Vietnam_Pro, Parkinsans } from "next/font/google";
import "./globals.css";

const beVietnam = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const headingFont = Parkinsans({
  subsets: ["latin", "vietnamese"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-heading",
  display: "swap",
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
        {children}
      </body>
    </html>
  );
}
