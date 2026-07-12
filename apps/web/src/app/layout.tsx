import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";

import "../index.css";
import Header from "@/components/header";
import Providers from "@/components/providers";

const geistSans = Geist({
	subsets: ["latin"],
	variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
	subsets: ["latin"],
	variable: "--font-geist-mono",
});

const inter = Inter({
	subsets: ["latin"],
	variable: "--font-inter",
});

export const metadata: Metadata = {
	// "Meridian" is the internal codename (ADR-0026). This scaffold title is
	// internal-only and must be replaced by tenant branding before any
	// tenant-visible release.
	description: "Internal controlled prototype. Not a tenant-facing surface.",
	title: {
		default: "Meridian Prototype (Internal)",
		template: "%s | Meridian Prototype",
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body
				className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} antialiased`}
			>
				<Providers>
					<a
						className="sr-only z-50 rounded-md bg-background px-3 py-2 text-foreground ring-1 ring-ring focus:not-sr-only focus:absolute focus:top-2 focus:left-2"
						href="#main-content"
					>
						Skip to main content
					</a>
					<div className="grid h-svh grid-rows-[auto_1fr]">
						<Header />
						<main id="main-content">{children}</main>
					</div>
				</Providers>
			</body>
		</html>
	);
}
