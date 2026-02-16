import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User } from 'lucide-react';

const AppNavbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const location = useLocation();

    // Detect Scroll for styling
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const isMarketingPage = ['/', '/about', '/contact', '/support'].includes(location.pathname);
    const navBackground = isMarketingPage && !isScrolled ? 'bg-transparent' : 'bg-white shadow-sm';
    const textColor = isMarketingPage && !isScrolled ? 'text-gray-900' : 'text-gray-900'; // Kept dark for visibility, can adjust if hero is dark

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navBackground} h-20 flex items-center`}>
            <div className="container mx-auto px-6 h-full flex items-center justify-between" dir="rtl">

                {/* Logo (Right) */}
                <Link to="/" className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#D4AF37] to-[#AA8431] rounded-lg flex items-center justify-center text-white font-serif font-bold text-xl">S</div>
                    <span className={`text-2xl font-bold tracking-tight ${textColor}`}>Signet</span>
                </Link>

                {/* Desktop Links (Center) */}
                <div className="hidden md:flex items-center gap-8">
                    <NavLink to="/" label="דף הבית" active={location.pathname === '/'} />
                    <NavLink to="/about" label="אודות" active={location.pathname === '/about'} />
                    <NavLink to="/contact" label="צור קשר" active={location.pathname === '/contact'} />
                    <NavLink to="/support" label="תמיכה" active={location.pathname === '/support'} />
                </div>

                {/* User / CTA (Left) */}
                <div className="hidden md:flex items-center gap-4">
                    <Link to="/app" className="text-sm font-medium hover:text-[#D4AF37] transition-colors">התחברות</Link>
                    <Link to="/create" className="px-6 py-2.5 bg-[#D4AF37] text-white rounded-full font-bold shadow-lg shadow-[#D4AF37]/20 hover:scale-105 transition-all text-sm">
                        צור הצעה
                    </Link>
                </div>

                {/* Mobile Toggle */}
                <button className="md:hidden text-gray-900" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                    {mobileMenuOpen ? <X /> : <Menu />}
                </button>

            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="absolute top-20 left-0 right-0 bg-white shadow-xl p-6 flex flex-col gap-4 md:hidden border-t border-gray-100" dir="rtl">
                    <MobileLink to="/" label="דף הבית" onClick={() => setMobileMenuOpen(false)} />
                    <MobileLink to="/about" label="אודות" onClick={() => setMobileMenuOpen(false)} />
                    <MobileLink to="/contact" label="צור קשר" onClick={() => setMobileMenuOpen(false)} />
                    <MobileLink to="/support" label="תמיכה" onClick={() => setMobileMenuOpen(false)} />
                    <div className="h-px bg-gray-100 my-2"></div>
                    <Link to="/app" className="w-full text-center py-3 rounded-lg bg-gray-50 text-gray-900 font-bold" onClick={() => setMobileMenuOpen(false)}>התחברות</Link>
                    <Link to="/create" className="w-full text-center py-3 rounded-lg bg-[#D4AF37] text-white font-bold" onClick={() => setMobileMenuOpen(false)}>צור הצעה חדשה</Link>
                </div>
            )}
        </nav>
    );
};

const NavLink = ({ to, label, active }) => (
    <Link to={to} className={`text-sm font-medium transition-colors hover:text-[#D4AF37] ${active ? 'text-[#D4AF37]' : 'text-gray-600'}`}>
        {label}
    </Link>
);

const MobileLink = ({ to, label, onClick }) => (
    <Link to={to} className="text-lg font-medium text-gray-800 py-2 border-b border-gray-50 last:border-0" onClick={onClick}>
        {label}
    </Link>
);

export default AppNavbar;
