import Header from "@/components/Header";
import Hero from "@/components/Hero";
import OddsFeed from "@/components/OddsFeed";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Hero />
        <OddsFeed />
      </main>
      <Footer />
    </div>
  );
}
