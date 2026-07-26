import { Space_Grotesk, IBM_Plex_Sans, JetBrains_Mono } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import LatencyIndicator from "@/components/LatencyIndicator";
import "./globals.css";

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "700"],
});
const body = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600"],
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
});

export const metadata = {
  title: "ShortLink",
  description: "A production-grade URL shortener",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={display.variable + " " + body.variable + " " + mono.variable}
    >
      <body>
        <AuthProvider>{children}</AuthProvider>
        <LatencyIndicator />
      </body>
    </html>
  );
}
