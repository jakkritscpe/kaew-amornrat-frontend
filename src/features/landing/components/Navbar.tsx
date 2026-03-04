import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MonitorSmartphone, Menu, X, PhoneCall } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav
            className={cn(
                'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
                isScrolled
                    ? 'bg-white/80 backdrop-blur-md shadow-sm py-4'
                    : 'bg-transparent py-6'
            )}
        >
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-2">
                        <div className={cn("p-2 rounded-lg", isScrolled ? "bg-[#044F88]/10" : "bg-white/10")}>
                            <MonitorSmartphone className={cn("w-6 h-6", isScrolled ? "text-[#044F88]" : "text-white")} />
                        </div>
                        <span className={cn(
                            "font-bold text-xl",
                            isScrolled ? "text-[#00223A]" : "text-white"
                        )}>
                            หจก.แก้วอมรรัตน์
                        </span>
                    </div>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-8">
                        <a href="#home" className={cn("font-medium transition-colors hover:text-[#C2410C]", isScrolled ? "text-[#6f6f6f]" : "text-white/80")}>หน้าหลัก</a>
                        <a href="#services" className={cn("font-medium transition-colors hover:text-[#C2410C]", isScrolled ? "text-[#6f6f6f]" : "text-white/80")}>บริการ</a>
                        <a href="#contact" className={cn("font-medium transition-colors hover:text-[#C2410C]", isScrolled ? "text-[#6f6f6f]" : "text-white/80")}>ติดต่อ</a>
                        <Link to="/login">
                            <Button
                                variant="outline"
                                className={cn(
                                    "border-2 hover:bg-[#C2410C] hover:text-white hover:border-[#C2410C] transition-all",
                                    isScrolled ? "border-[#C2410C] text-[#C2410C]" : "border-white text-[#C2410C] hover:border-transparent"
                                )}
                            >
                                เข้าสู่ระบบพนักงาน
                            </Button>
                        </Link>
                        <Button className="bg-[#C2410C] hover:bg-[#C2410C]/90 text-white gap-2">
                            <PhoneCall className="w-4 h-4" />
                            โทรเลย
                        </Button>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button
                        className="md:hidden p-2"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? (
                            <X className={isScrolled ? "text-[#00223A]" : "text-white"} />
                        ) : (
                            <Menu className={isScrolled ? "text-[#00223A]" : "text-white"} />
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden absolute top-full left-0 right-0 bg-white shadow-lg border-t border-gray-100 py-4 px-4 flex flex-col gap-4">
                    <a href="#home" className="text-[#00223A] font-medium py-2" onClick={() => setIsMobileMenuOpen(false)}>หน้าหลัก</a>
                    <a href="#services" className="text-[#00223A] font-medium py-2" onClick={() => setIsMobileMenuOpen(false)}>บริการ</a>
                    <a href="#contact" className="text-[#00223A] font-medium py-2" onClick={() => setIsMobileMenuOpen(false)}>ติดต่อ</a>
                    <div className="flex flex-col gap-2 pt-4 border-t border-gray-100">
                        <Link to="/login" className="w-full">
                            <Button variant="outline" className="w-full" onClick={() => setIsMobileMenuOpen(false)}>
                                เข้าสู่ระบบพนักงาน
                            </Button>
                        </Link>
                        <Button className="w-full bg-[#C2410C] hover:bg-[#C2410C]/90">
                            <PhoneCall className="w-4 h-4 mr-2" />
                            โทรเลย
                        </Button>
                    </div>
                </div>
            )}
        </nav>
    );
}
