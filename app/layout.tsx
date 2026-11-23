import type { Metadata, Viewport } from "next";
import { Caveat, Fraunces, Great_Vibes, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { DevHooks } from "@/components/DevHooks";
import { ServiceWorker } from "@/components/ServiceWorker";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["SOFT", "opsz"],
  display: "swap",
});
const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"], display: "swap" });
const caveat = Caveat({ variable: "--font-caveat", subsets: ["latin"], display: "swap" });
const vibes = Great_Vibes({ variable: "--font-vibes", subsets: ["latin"], weight: "400", display: "swap" });

export const metadata: Metadata = {
  title: { default: "AuraGarden", template: "%s · AuraGarden" },
  description: "A little life OS where every finished task grows a garden.",
  applicationName: "AuraGarden",
  appleWebApp: { capable: true, title: "AuraGarden", statusBarStyle: "default" },
  formatDetection: { telephone: false },
  referrer: "no-referrer",
  robots: { index: false, follow: false },
  icons: {
    icon: [{ url: "/icons/favicon-48.png", sizes: "48x48", type: "image/png" }, { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FBF7F0" },
    { media: "(prefers-color-scheme: dark)", color: "#121A16" },
  ],
};

// Applies the saved theme before first paint so there's no flash.
const themeScript = `(function(){try{var t=localStorage.getItem('ag-theme')||'auto';var d=t==='dark'||(t==='auto'&&matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');if(localStorage.getItem('ag-reduce-motion')==='1')document.documentElement.classList.add('reduce-motion');var a=localStorage.getItem('ag-accent');if(a)document.documentElement.style.setProperty('--accent',a);}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en-IE"
      suppressHydrationWarning
      className={`${fraunces.variable} ${jakarta.variable} ${caveat.variable} ${vibes.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full">
        {children}
        <DevHooks />
        <ServiceWorker />
      </body>
    </html>
  );
}
