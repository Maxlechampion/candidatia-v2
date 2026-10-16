import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "CandidatIA - Generez votre pack de candidature en 1 clic",
  description:
    "CV optimise, lettre de motivation et guide d'entretien generes par IA.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Le <html> et <body> sont fournis par app/[locale]/layout.tsx
  // Ce layout ne sert qu'a importer globals.css et definir les metadata.
  return children;
}