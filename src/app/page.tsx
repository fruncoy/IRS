import { Navbar } from "@/components/layout/Navbar";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <Navbar />
      <Hero />
      <HowItWorks />

      <Footer />
    </main>
  );
}
