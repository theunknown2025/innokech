import { useState } from 'react';
import AddClient from './AddClient';
import ClientList from './ClientList';

export default function ClientManager() {
  const [activeTab, setActiveTab] = useState<'add' | 'list'>('add');

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Gestion des Clients</h1>
          <p className="text-sm sm:text-base text-slate-600 mt-1">Gérez vos clients et leurs informations</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200 mb-6">
          <nav className="flex space-x-4">
            <button
              onClick={() => setActiveTab('add')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'add'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              Nouveau client
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'list'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              Liste des clients
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'add' && <AddClient onSuccess={() => setActiveTab('list')} />}
          {activeTab === 'list' && <ClientList />}
        </div>
      </div>
    </div>
  );
}
