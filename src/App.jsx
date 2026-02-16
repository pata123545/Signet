import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import CreateProposal from './pages/CreateProposal';
import Proposals from './pages/Proposals';
import Customers from './pages/Customers';
import Settings from './pages/Settings';
import About from './pages/About';
import Contact from './pages/Contact';
import Support from './pages/Support';
import Auth from './pages/Auth';
import ProtectedRoute from './components/ProtectedRoute'; // Import ProtectedRoute
import SidebarLayout from './components/SidebarLayout';
import PublicProposalView from './pages/PublicProposalView';

function App() {
    return (
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Toaster position="top-center" reverseOrder={false} />
            <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/support" element={<Support />} />
                <Route path="/auth" element={<Auth />} />

                {/* Focus Mode Route (No Sidebar) - Protected */}
                <Route path="/create" element={
                    <ProtectedRoute>
                        <CreateProposal />
                    </ProtectedRoute>
                } />
                <Route path="/proposal/:id" element={
                    <ProtectedRoute>
                        <CreateProposal />
                    </ProtectedRoute>
                } />

                {/* Public Share Link (Must remain public) */}
                <Route path="/share/:id" element={<PublicProposalView />} />

                {/* Protected / App Routes (Wrapped in Sidebar) */}
                <Route element={
                    <ProtectedRoute>
                        <SidebarLayout />
                    </ProtectedRoute>
                }>
                    <Route path="/app" element={<Dashboard />} />
                    <Route path="/proposals" element={<Proposals />} />
                    <Route path="/customers" element={<Customers />} />
                    <Route path="/settings" element={<Settings />} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}

export default App;
