import React, { useState, useEffect } from 'react';
import { Menu, PlusSquare, MessageSquare, Settings, HelpCircle, Search, Trash2, Sparkles, Diamond, Clock, Folder } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useNavigate, useParams } from 'react-router-dom';

const Sidebar = ({ isOpen, onToggle }) => {
    const [chats, setChats] = useState([]);
    const navigate = useNavigate();
    const { chatId } = useParams();

    const fetchChats = async () => {
        try {
            const fixedUserId = 'b75849f3-1399-4846-84b5-9dadb5b851b4';

            // Fetch chats ordered by created_at (the only timestamp column)
            let response = await supabase
                .from('chats')
                .select('chat_id, title, created_at')
                .eq('user_id', fixedUserId)
                .order('created_at', { ascending: false });

            if (response.error) {
                console.error('Error fetching chats:', response.error);
                // Fallback: no ordering just to get data
                const finalFetch = await supabase
                    .from('chats')
                    .select('chat_id, title')
                    .eq('user_id', fixedUserId);
                if (!finalFetch.error) setChats(finalFetch.data || []);
            } else {
                setChats(response.data || []);
            }
        } catch (err) {
            console.error('Critical failure in fetchChats:', err);
            if (err.message?.includes('Failed to fetch')) {
                console.warn('Network error: Supabase connection failed.');
            }
        }
    };

    // Fetch on mount and when navigating to a new chat
    useEffect(() => {
        fetchChats();
    }, [chatId]);

    // Listen for refresh events from other components (e.g. after saving a chat/invoice)
    useEffect(() => {
        const handleRefresh = () => fetchChats();
        window.addEventListener('sidebar-refresh', handleRefresh);
        return () => window.removeEventListener('sidebar-refresh', handleRefresh);
    }, []);

    return (
        <aside
            className={`
                fixed top-0 right-0 h-screen bg-[#e9eef6] border-l border-slate-200/60 flex flex-col transition-all duration-300 z-40 overflow-hidden shadow-xl
                ${isOpen ? 'w-[260px]' : 'w-[75px]'}
            `}
            dir="rtl"
        >
            <div className="flex flex-col h-full">
                {/* TOP SECTION: Controls (Always Visible) */}
                <div className={`
                    flex items-center gap-2 p-4 pt-6 border-b border-slate-300/30
                    ${isOpen ? 'justify-between px-6' : 'flex-col justify-center px-0'}
                `}>
                    <button
                        onClick={onToggle}
                        className="p-3 text-slate-800 hover:bg-white/40 rounded-2xl transition-all"
                        title="תפריט"
                    >
                        <Menu size={isOpen ? 24 : 22} />
                    </button>
                    <button
                        className="p-3 text-slate-800 hover:bg-white/40 rounded-2xl transition-all"
                        title="חיפוש"
                    >
                        <Search size={isOpen ? 22 : 22} />
                    </button>
                </div>

                {/* NEW CHAT / QUICK ACTIONS */}
                <div className="px-3 mt-6 mb-8">
                    <button
                        onClick={() => navigate('/')}
                        className={`flex items-center gap-3 bg-white/60 hover:bg-white/80 text-slate-800 border border-slate-200/50 rounded-2xl transition-all h-14 ${isOpen ? 'px-6 w-full shadow-sm' : 'justify-center w-14 mx-auto px-0 shadow-sm'}`}
                    >
                        <PlusSquare size={22} className="text-slate-800 shrink-0" />
                        {isOpen && <span className="font-semibold text-[15px]">שיחה חדשה</span>}
                    </button>
                </div>

                {/* SCROLLABLE LINKS */}
                <div className="flex-1 overflow-y-auto px-2 custom-scrollbar">
                    <div className="flex flex-col gap-2 mb-8 px-1">
                        <button
                            onClick={() => navigate('/files')}
                            className={`flex items-center gap-3 p-4 rounded-2xl hover:bg-white/30 text-slate-700 transition-all group ${!isOpen ? 'justify-center px-0' : ''}`}
                            title="הקבצים שלי"
                        >
                            <Folder size={22} className="text-slate-500 group-hover:text-slate-900" />
                            {isOpen && <span className="text-[15px] font-medium">הקבצים שלי</span>}
                        </button>
                    </div>

                    {isOpen && (
                        <>
                            <div className="px-4 mb-4 text-[11px] font-bold text-slate-500 uppercase tracking-[0.1em] opacity-60 flex items-center gap-2">
                                <Clock size={14} />
                                היסטוריה
                            </div>
                            <div className="flex flex-col gap-1 px-1">
                                {chats.map((chat) => (
                                    <button
                                        key={chat.chat_id}
                                        onClick={() => navigate(`/chat/${chat.chat_id}`)}
                                        className={`flex items-center gap-3 p-3.5 rounded-2xl transition-all text-right group ${chatId === chat.chat_id?.toString() ? 'bg-white/50 text-slate-800 font-semibold' : 'hover:bg-white/20 text-slate-600'}`}
                                    >
                                        <MessageSquare size={18} className={`shrink-0 ${chatId === chat.chat_id?.toString() ? 'text-slate-800' : 'text-slate-400 group-hover:text-slate-800'}`} />
                                        <span className="text-[14px] truncate">{chat.title}</span>
                                    </button>
                                ))}
                            </div>
                        </>
                    )}

                    {!isOpen && (
                        <div className="flex flex-col items-center gap-4 border-t border-slate-300/30 pt-6 mt-2">
                            <button onClick={() => navigate('/')} className="p-3 text-slate-400 hover:text-slate-900 transition-colors"><MessageSquare size={22} /></button>
                            <button className="p-3 text-slate-400 hover:text-slate-900 transition-colors"><Sparkles size={22} /></button>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
