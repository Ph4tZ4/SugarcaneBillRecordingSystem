import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Header from './components/Header';
import Stats from './components/Stats';
import BillForm from './components/BillForm';
import BillList from './components/BillList';
import Settings from './components/Settings';
import SharedBillView from './components/SharedBillView';
import './App.css';

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleBillRecorded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const MainLayout = () => (
    <div className="min-h-screen bg-gray-100 font-sans">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );

  return (
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

      <Routes>
        {/* Shared View Route (No Header/Nav) */}
        <Route path="/share/:token" element={<SharedBillView />} />

        {/* Main App Routes (With Header/Nav) */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<BillForm onBillRecorded={handleBillRecorded} />} />
          <Route path="/bills" element={
            <>
              <Stats refreshTrigger={refreshTrigger} />
              <BillList />
            </>
          } />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
