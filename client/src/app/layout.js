import { AuthProvider } from "@/context/AuthContext";
import OfflineGuard from "@/components/OfflineGuard";
import CookieBanner from "@/components/CookieBanner";
import Footer from "@/components/Footer";
import "./globals.css";

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    default: "ShortLink | Simple links, clear insights",
    template: "%s | ShortLink",
  },
  description: "Create clean short links, understand each click, and control where your links lead.",
  openGraph: {
    type: "website",
    siteName: "ShortLink",
    title: "ShortLink | Simple links, clear insights",
    description: "Create clean short links, understand each click, and control where your links lead.",
  },
  twitter: {
    card: "summary",
    title: "ShortLink | Simple links, clear insights",
    description: "Create clean short links, understand each click, and control where your links lead.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <OfflineGuard>
          <AuthProvider>
            <div className="app-frame">
              {children}
              <Footer />
              <CookieBanner />
            </div>
          </AuthProvider>
        </OfflineGuard>
      </body>
    </html>
  );
}
