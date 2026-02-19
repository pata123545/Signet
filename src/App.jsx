import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Toaster } from 'react-hot-toast'; // Restoring Toaster as well
import ChatInterface from './pages/ChatInterface';
import MyFiles from './pages/MyFiles';
import MainLayout from './layouts/MainLayout';

function App() {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    if (loading) {
        return <div className="min-h-screen bg-[#FBFBF9]" />; // Match app bg
    }

    return (
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Toaster position="top-center" reverseOrder={false} />
            <MainLayout session={session}>
                <Routes>
                    <Route path="/" element={<ChatInterface />} />
                    <Route path="/files" element={<MyFiles />} />
                    <Route path="/chat/:chatId" element={<ChatInterface />} />
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </MainLayout>
        </Router>
    );
}

export default App;
