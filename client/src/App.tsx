import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Header from './components/Header';
import BillForm from './components/BillForm';
import BillList from './components/BillList';
import Stats from './components/Stats';
import Settings from './components/Settings';
import FarmerList from './components/FarmerList';
import Login from './components/Login';
import ActivityLogs from './components/ActivityLogs';
import UserManagement from './components/UserManagement';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import SharedBillView from './components/SharedBillView';
import './App.css';

const App: React.FC = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleBillAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <AuthProvider>
      <Router>
        <Toaster
          position="top-center"
          reverseOrder={false}
          toastOptions={{
            style: {
              fontSize: '1.1rem',
              padding: '16px 24px',
              maxWidth: '500px',
            },
            success: {
              duration: 4000,
            },
            error: {
              duration: 5000,
            },
          }}
        />
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/share/:token" element={<SharedBillView />} />

            <Route element={<ProtectedRoute />}>
              <Route element={
                <>
                  <Header />
                  <main className="container mx-auto px-4 py-8">
                    <Routes>
                      {/* Admin & Root Routes */}
                      <Route path="/" element={<BillForm onBillRecorded={handleBillAdded} />} />
                      <Route path="/bills" element={<BillList refreshTrigger={refreshTrigger} />} />
                      <Route path="/settings" element={<Settings />} />

                      {/* Root Only Routes */}
                      <Route element={<ProtectedRoute roles={['root']} />}>
                        <Route path="/dashboard" element={<Stats refreshTrigger={refreshTrigger} />} />
                        <Route path="/farmers" element={<FarmerList />} />
                        <Route path="/logs" element={<ActivityLogs />} />
                        <Route path="/users" element={<UserManagement />} />
                      </Route>
                    </Routes>
                  </main>
                </>
              } path="/*" />
            </Route>

            {/* Redirect unknown routes to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
