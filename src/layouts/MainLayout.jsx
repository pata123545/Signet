import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

const MainLayout = ({ children, session }) => {
    const [sidebarOpen, setSidebarOpen] = useState(true);

    return (
        <div className="relative w-full min-h-screen overflow-x-hidden bg-[#FBFBF9] flex" dir="rtl">
            {/* SIDEBAR (Right - Mini/Full Toggle) */}
            <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

            {/* CONTENT WRAPPER */}
            <div
                className={`flex-1 h-full relative transition-all duration-300 ${sidebarOpen ? 'pr-[260px]' : 'pr-[75px]'}`}
            >
                <Header
                    session={session}
                    sidebarOpen={sidebarOpen}
                    onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                    onProfileClick={() => window.dispatchEvent(new CustomEvent('open-profile'))}
                />
                <main className="h-full w-full overflow-hidden bg-[#FBFBF9]">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
