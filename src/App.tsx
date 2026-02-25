import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';
import ClientManager from './components/clientmanager/ClientManager';
import QuotesPage from './components/QuotesPage';
import QuoteManager from './components/quotes/QuoteManager';
import QuoteTracking from './components/quotes/QuoteTracking';
import Login from './components/Login';
import { pb } from './lib/pocketbase';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(pb.authStore.isValid);

  useEffect(() => {
    // Check auth state on mount
    setIsAuthenticated(pb.authStore.isValid);

    // Subscribe to auth changes if needed, though PocketBase SDK updates authStore directly
    const unsubscribe = pb.authStore.onChange((token, model) => {
      setIsAuthenticated(!!token);
    });

    return () => {
      unsubscribe();
    }
  }, []);

  const handleTabChange = (tab: string) => {
    if (tab === 'logout') {
      if (confirm('Voulez-vous vraiment vous déconnecter ?')) {
        pb.authStore.clear();
        setIsAuthenticated(false);
      }
      return;
    }
    setActiveTab(tab);
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'profile':
        return <Profile />;
      case 'clients':
        return <ClientManager />;
      case 'quotes':
        return <QuotesPage />;
      case 'quotes-generator':
        return <QuoteManager />;
      case 'quotes-tracking':
        return <QuoteTracking />;
      default:
        return <Dashboard />;
    }
  };

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-50">
      <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />
      <main className="flex-1 overflow-y-auto pt-16 lg:pt-0">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;
