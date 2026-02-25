import { useState } from 'react';
import QuoteGenerator from './QuoteGenerator';
import QuoteList from './QuoteList';

export default function QuoteManager() {
  const [activeTab, setActiveTab] = useState<'new' | 'list'>('new');

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Gestion des Devis / Factures</h1>
          <p className="text-sm sm:text-base text-slate-600 mt-1">Créez et gérez vos devis et factures</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200 mb-6">
          <nav className="flex space-x-4">
            <button
              onClick={() => setActiveTab('new')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'new'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              Nouveau Devis / Facture
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'list'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              Liste Devis / Facture
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'new' && <QuoteGenerator />}
          {activeTab === 'list' && <QuoteList onEdit={(id) => setActiveTab('new')} />}
        </div>
      </div>
    </div>
  );
}
