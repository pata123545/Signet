import { Menu, Search, Share, MoreVertical, UserCircle, Sparkles } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const Header = ({ onProfileClick, sidebarOpen }) => {
    const location = useLocation();
    // Active chat detected when URL is /chat/something
    const isInChat = location.pathname.startsWith('/chat/');

    return (
        <header
            dir="rtl"
            className="fixed top-0 left-0 h-16 bg-transparent z-50 flex justify-between items-center px-6 transition-all duration-300"
            style={{ width: `calc(100% - ${sidebarOpen ? '260px' : '75px'})` }}
        >
            {/* RIGHT SIDE: Branding (Pure Pearl White Minimalist) */}
            <div className="flex items-center gap-6">
                <div
                    className="flex items-center gap-3 select-none cursor-pointer group"
                    onClick={() => { window.location.href = '/' }}
                >
                    <span className="text-2xl font-black text-slate-800 tracking-tighter uppercase group-hover:text-slate-600 transition-colors">Busni</span>
                    <div className="h-8 w-[1px] bg-slate-200/50 mx-2" />
                    <Sparkles size={16} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
                </div>
            </div>

            {/* LEFT SIDE: Actions cluster (Clean Slate Icons) */}
            <div className="flex items-center gap-2 h-10">
                {isInChat && (
                    <>
                        <button
                            className="p-2.5 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
                        >
                            <Share size={20} />
                        </button>
                        <button
                            onClick={onProfileClick}
                            className="p-2.5 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
                        >
                            <MoreVertical size={20} />
                        </button>
                    </>
                )}
                <button
                    onClick={onProfileClick}
                    className="p-2.5 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
                >
                    <UserCircle size={22} />
                </button>
            </div>
        </header>
    );
};

export default Header;
