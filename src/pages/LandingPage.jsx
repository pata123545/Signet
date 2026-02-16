import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, Smartphone, Layout, FileText, Star, Shield, Zap } from 'lucide-react';
import AppNavbar from '../components/AppNavbar';
import { motion } from 'framer-motion';

const LandingPage = () => {
    return (
        <div className="bg-[#FDFDFD] min-h-screen font-sans" dir="rtl">
            <AppNavbar />

            {/* HERO SECTION */}
            <section className="relative px-6 pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                <div className="max-w-7xl mx-auto text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] text-sm font-bold mb-6 border border-[#D4AF37]/20">
                            <Star size={14} fill="#D4AF37" />
                            <span>הסטנדרט החדש בהצעות מחיר</span>
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-black text-gray-900 leading-[1.1] mb-6 tracking-tight">
                            צור הצעות מחיר <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#B8860B]">בלתי נשכחות.</span>
                        </h1>
                        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                            פלטפורמת Signet מאפשרת לך לעצב, לנהל ולשלוח הצעות מחיר ברמה בינלאומית תוך שניות.
                            אל תסתפק במסמך וורד רגיל - תן למותג שלך את הכבוד המגיע לו.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <Link to="/create" className="px-8 py-4 bg-[#D4AF37] text-white text-lg font-bold rounded-xl shadow-xl shadow-[#D4AF37]/30 hover:bg-[#c49f27] transition-all hover:scale-105 flex items-center gap-2">
                                צור הצעה ראשונה חינם <ArrowRight size={20} className="rotate-180" />
                            </Link>
                            <Link to="/about" className="px-8 py-4 bg-white text-gray-900 text-lg font-bold rounded-xl border border-gray-200 hover:bg-gray-50 transition-all">
                                איך זה עובד?
                            </Link>
                        </div>
                    </motion.div>
                </div>

                {/* Abstract Background Elements */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-0 pointer-events-none opacity-40">
                    <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-[#D4AF37]/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-gray-200/50 rounded-full blur-3xl"></div>
                </div>
            </section>

            {/* FEATURES GRID */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">למה לבחור ב-Signet?</h2>
                        <p className="text-gray-500 max-w-2xl mx-auto">אנחנו מבינים שעסקים נמדדים בפרטים הקטנים. לכן בנינו מערכת שלא מתפשרת על עיצוב או פונקציונליות.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { icon: Layout, title: 'עיצוב פרימיום', desc: 'תבניות A4 מעוצבות מראש המשדרות יוקרה ומקצועיות.' },
                            { icon: Zap, title: 'מהירות שיא', desc: 'הפקת מסמך מלא בפחות מ-60 שניות עם חישובים אוטומטיים.' },
                            { icon: Shield, title: 'פרטיות ואבטחה', desc: 'הנתונים שלך נשמרים בענן בטכנולוגיית Supabase המאובטחת.' }
                        ].map((feature, i) => (
                            <div key={i} className="p-8 rounded-2xl bg-gray-50 border border-gray-100 hover:border-[#D4AF37]/30 hover:shadow-lg transition-all group">
                                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                                    <feature.icon className="text-[#D4AF37]" size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                                <p className="text-gray-500 leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA SECTION */}
            <section className="py-20">
                <div className="max-w-5xl mx-auto px-6">
                    <div className="bg-[#1A1A1A] rounded-3xl p-12 text-center text-white relative overflow-hidden">
                        <div className="relative z-10">
                            <h2 className="text-3xl lg:text-4xl font-bold mb-6">מוכן לשדרג את העסק שלך?</h2>
                            <p className="text-gray-400 mb-8 max-w-xl mx-auto">הצטרף למאות בעלי עסקים שכבר מפיקים הצעות מחיר מרהיבות עם Signet.</p>
                            <Link to="/create" className="inline-block px-10 py-4 bg-[#D4AF37] text-white font-bold rounded-xl hover:bg-[#c49f27] transition-all hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]">
                                התחל עכשיו - חינם
                            </Link>
                        </div>
                        {/* Pattern */}
                        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '30px 30px' }}></div>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="bg-white border-t border-gray-100 py-12">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-2xl font-black tracking-tight text-gray-900">Signet.</div>
                    <div className="text-gray-400 text-sm">© 2026 Signet Inc. All rights reserved.</div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
