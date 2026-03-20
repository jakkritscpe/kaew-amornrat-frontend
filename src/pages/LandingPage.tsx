import { Navbar } from '../features/landing/components/Navbar';
import { Hero } from '../features/landing/components/Hero';
import { Services } from '../features/landing/components/Services';
import { Contact } from '../features/landing/components/Contact';
import { Footer } from '../features/landing/components/Footer';
import { FloatingDock } from '../features/landing/components/FloatingDock';

export function LandingPage() {
    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <main>
                <Hero />
                <Services />
                <Contact />
            </main>
            <Footer />
            <FloatingDock />
        </div>
    );
}
