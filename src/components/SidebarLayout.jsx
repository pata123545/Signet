import React, { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import {
  LayoutGrid,
  FileText,
  Users,
  Settings,
  Plus,
  User
} from 'lucide-react';

const SidebarLayout = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const { data, error } = await supabase
            .from('profiles')
            .select('full_name, avatar_url, business_name')
            .eq('id', user.id)
            .single();

          if (!error && data) {
            setProfile(data);
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  return (
    <div className="flex h-screen bg-[#FDFDFD] font-sans overflow-hidden" dir="rtl">

      {/* RIGHT SIDEBAR (Fixed, High Z-Index) */}
      <aside className="w-[260px] bg-white border-l border-gray-100 flex flex-col shrink-0 z-[100] fixed top-0 right-0 h-full shadow-[0_0_40px_rgba(0,0,0,0.02)]">

        {/* LOGO */}
        <div className="h-20 flex items-center px-8 border-b border-gray-50/50">
          <NavLink to="/" className="font-black text-xl tracking-tight text-gray-900 flex items-center gap-1 group">
            Signet<span className="text-black group-hover:text-gray-700 transition-colors text-3xl leading-none">.</span>
          </NavLink>
        </div>

        {/* PRIMARY CTA */}
        <div className="px-6 py-6">
          <NavLink
            to="/create"
            className="flex items-center justify-center gap-2 w-full py-3 bg-[#1A1A1A] text-white rounded-lg font-bold text-xs hover:bg-black hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-black/5"
          >
            <Plus size={16} />
            <span>פרויקט חדש</span>
          </NavLink>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 px-4 space-y-1">
          <NavItem to="/app" icon={LayoutGrid} label="לוח בקרה" />
          <NavItem to="/proposals" icon={FileText} label="הצעות מחיר" />
          <NavItem to="/customers" icon={Users} label="לקוחות" />
          <NavItem to="/settings" icon={Settings} label="הגדרות" />
        </nav>

        {/* BOTTOM PROFILE */}
        <div className="p-4 border-t border-gray-50 bg-gray-50/30">
          <div className="flex items-center gap-3 px-2 group cursor-pointer hover:bg-black/5 rounded-lg transition-colors p-2">
            <div className="w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="flex items-center justify-center w-full h-full bg-black/5 text-gray-500 font-bold text-xs">
                  {profile?.full_name?.charAt(0) || <User size={14} />}
                </div>
              )}
            </div>
            <div className="text-xs text-right overflow-hidden flex-1">
              <p className="font-bold text-gray-900 group-hover:text-black transition-colors truncate">
                {profile?.full_name || 'Signet User'}
              </p>
              <p className="text-gray-400 text-[10px] truncate">
                {profile?.business_name || 'Free Plan'}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* CONTENT WRAPPER */}
      {/* 
          1. mr-[260px]: Pushes content Left to account for Fixed Right Sidebar in RTL.
          2. h-full / overflow-hidden: Ensures the layout handles scrolling internally.
      */}
      <div className="flex-1 mr-[260px] h-full relative overflow-hidden bg-[#FAFAFA]">
        <Outlet />
      </div>
    </div>
  );
};

const NavItem = ({ to, icon: Icon, label }) => (
  <NavLink
    to={to}
    end={to === '/app'}
    className={({ isActive }) => `
      flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold transition-all
      ${isActive
        ? 'text-gray-900 bg-black/5'
        : 'text-gray-500 hover:text-gray-900 hover:bg-black/5'}
    `}
  >
    <Icon size={16} />
    <span>{label}</span>
  </NavLink>
);

export default SidebarLayout;
