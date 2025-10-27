import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import ProtectedRoute from './components/ProtectedRoute';
import WelcomeScreen from './components/WelcomeScreen';
import Dashboard from './components/Dashboard';
import FindDoctors from './components/FindDoctors';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import { isLoggedIn } from './utils/navigation';

// Placeholder components for routes
const AboutPage = () => <div style={{ padding: '40px', textAlign: 'center' }}><h2>About PatientCare</h2><p>Learn more about our healthcare platform for Bahrain.</p></div>;
const ContactPage = () => <div style={{ padding: '40px', textAlign: 'center' }}><h2>Contact Us</h2><p>Get in touch with our support team.</p></div>;
const AppointmentsPage = () => <div style={{ padding: '40px', textAlign: 'center' }}><h2>My Appointments</h2><p>Manage your medical appointments here.</p></div>;
const ChatPage = () => <div style={{ padding: '40px', textAlign: 'center' }}><h2>Chat with Doctor</h2><p>Secure messaging with healthcare providers.</p></div>;
const RecordsPage = () => <div style={{ padding: '40px', textAlign: 'center' }}><h2>Medical Records</h2><p>Access your health records and prescriptions.</p></div>;
const SupportPage = () => <div style={{ padding: '40px', textAlign: 'center' }}><h2>Support Center</h2><p>Get help with PatientCare platform.</p></div>;

function App(): JSX.Element {
  const [user, setUser] = useState<{ name: string; avatar?: string } | null>(null);

  // Check for existing authentication on app load
  useEffect(() => {
    if (isLoggedIn()) {
      const userData = localStorage.getItem('userData');
      if (userData) {
        try {
          setUser(JSON.parse(userData));
        } catch (error) {
          console.error('Error parsing user data:', error);
          localStorage.removeItem('userData');
          localStorage.removeItem('authToken');
        }
      }
    }
  }, []);

  return (
    <ToastProvider>
      <Router>
        <Routes>
          <Route path="/" element={<WelcomeScreen />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/support" element={<SupportPage />} />
          
          {/* Protected Routes */}
          <Route path="/doctors" element={
            <ProtectedRoute message="Please log in to find doctors">
              <FindDoctors />
            </ProtectedRoute>
          } />
          <Route path="/appointments" element={
            <ProtectedRoute message="Please log in to view your appointments">
              <AppointmentsPage />
            </ProtectedRoute>
          } />
          <Route path="/chat" element={
            <ProtectedRoute message="Please log in to chat with doctors">
              <ChatPage />
            </ProtectedRoute>
          } />
          <Route path="/records" element={
            <ProtectedRoute message="Please log in to view your medical records">
              <RecordsPage />
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute message="Please log in to access your dashboard">
              {user ? <Dashboard user={user} /> : <div>Loading...</div>}
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </ToastProvider>
  );
}

export default App;