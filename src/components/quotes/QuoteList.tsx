import { useState, useEffect, useCallback, useRef } from 'react';
import { FileText, Eye, Edit, Trash2, Download, Building2, User } from 'lucide-react';
import { pb } from '../../lib/pocketbase';

interface ReferenceGroup {
  id: string;
  reference: string;
  designations: Array<{
    id: string;
    designation: string;
    unite: string;
    quantite: number;
    prixUnitaire: number;
    prixTotal: number;
  }>;
}

export interface QuoteRecord {
  id: string;
  collectionId: string;
  collectionName: string;
  created: string;
  updated: string;
  type: 'devis' | 'facture';
  clientId: string;
  client: any;
  items: ReferenceGroup[];
  totalHT: number;
  tva: number;
  totalTTC: number;
  date: string;
  docNumber?: string;
}

type QuoteListProps = {
  onEdit?: (id: string) => void;
};

export default function QuoteList({ onEdit }: QuoteListProps) {
  const [quotes, setQuotes] = useState<QuoteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<QuoteRecord | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const mountedRef = useRef(true);

  const fetchQuotes = useCallback(async () => {
    if (!mountedRef.current) return;
    
    try {
      if (!pb.authStore.isValid) {
        setError('Non authentifié');
        return;
      }
      
      setLoading(true);
      setError(null);
      
      let records: QuoteRecord[] = [];
      
      // Try getFullList first without sort to avoid potential issues
      try {
        records = await pb.collection('quotes').getFullList<QuoteRecord>();
        // Sort client-side if needed
        records.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
      } catch (fullListError: any) {
        // If getFullList fails, try getList
        console.warn('getFullList failed, trying getList:', fullListError);
        try {
          // Try without sort parameter first
          const result = await pb.collection('quotes').getList<QuoteRecord>(1, 500);
          
          records = result.items;
          
          // Sort client-side
          records.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
          
          if (result.totalPages > 1) {
            const allRecords = [...records];
            for (let page = 2; page <= result.totalPages; page++) {
              const pageResult = await pb.collection('quotes').getList<QuoteRecord>(page, 500);
              allRecords.push(...pageResult.items);
            }
            // Sort all records
            allRecords.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
            records = allRecords;
          }
        } catch (getListError: any) {
          console.error('Error fetching quotes:', getListError);
          if (mountedRef.current) {
            setError('Erreur lors du chargement des devis/factures: ' + (getListError.message || 'Erreur inconnue'));
          }
        }
      }
      
      if (mountedRef.current) {
        setQuotes(records);
      }
    } catch (err: any) {
      console.error('Error fetching quotes:', err);
      if (mountedRef.current) {
        setError('Erreur lors du chargement des devis/factures');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchQuotes();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchQuotes]);

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      return;
    }

    try {
      await pb.collection('quotes').delete(id);
      setQuotes(prev => prev.filter(q => q.id !== id));
      if (selectedQuote?.id === id) {
        setSelectedQuote(null);
        setShowViewModal(false);
      }
    } catch (error: any) {
      console.error('Error deleting quote:', error);
      alert('Erreur lors de la suppression: ' + (error.message || 'Erreur inconnue'));
    }
  };

  const handleView = (quote: QuoteRecord) => {
    setSelectedQuote(quote);
    setShowViewModal(true);
  };

  const handleGeneratePDF = async (quote: QuoteRecord) => {
    try {
      // Import DocGen dynamically
      const { generatePDF } = await import('./DocGen');
      await generatePDF(quote);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Erreur lors de la génération du PDF');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getClientName = (quote: QuoteRecord) => {
    if (!quote.client) return 'Client inconnu';
    if (quote.client.type === 'personne_morale') {
      return quote.client.company_name || 'Client inconnu';
    }
    return quote.client.full_name || 'Client inconnu';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-500">Chargement...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div>
      {quotes.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
          <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Aucun document</h3>
          <p className="text-slate-600">Aucun devis ou facture n'a été créé pour le moment.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Client</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Total TTC</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {quotes.map((quote) => (
                  <tr key={quote.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        quote.type === 'devis'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {quote.type === 'devis' ? 'Devis' : 'Facture'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {quote.client?.type === 'personne_morale' ? (
                          <Building2 className="w-4 h-4 text-blue-600" />
                        ) : (
                          <User className="w-4 h-4 text-green-600" />
                        )}
                        <span className="text-sm text-slate-800">{getClientName(quote)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {formatDate(quote.date || quote.created)}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-800">
                      {quote.totalTTC?.toFixed(2) || '0.00'} MAD
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleView(quote)}
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                          title="Voir"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleGeneratePDF(quote)}
                          className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors"
                          title="Télécharger PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEdit && onEdit(quote.id)}
                          className="p-2 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 rounded transition-colors"
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(quote.id)}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedQuote && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800">
                  {selectedQuote.type === 'devis' ? 'Devis' : 'Facture'} - {getClientName(selectedQuote)}
                </h2>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6">
              {/* Client Info */}
              <div className="mb-6 p-4 bg-slate-50 rounded-lg">
                <h3 className="font-semibold text-slate-800 mb-2">Informations client</h3>
                <div className="grid grid-cols-2 gap-2 text-sm text-slate-600">
                  {selectedQuote.client?.type === 'personne_morale' ? (
                    <>
                      {selectedQuote.client.company_name && <div>Nom: {selectedQuote.client.company_name}</div>}
                      {selectedQuote.client.ice && <div>ICE: {selectedQuote.client.ice}</div>}
                      {selectedQuote.client.company_address && <div>Adresse: {selectedQuote.client.company_address}</div>}
                      {selectedQuote.client.company_phone && <div>Téléphone: {selectedQuote.client.company_phone}</div>}
                      {selectedQuote.client.company_email && <div>Email: {selectedQuote.client.company_email}</div>}
                    </>
                  ) : (
                    <>
                      {selectedQuote.client?.full_name && <div>Nom: {selectedQuote.client.full_name}</div>}
                      {selectedQuote.client?.address && <div>Adresse: {selectedQuote.client.address}</div>}
                      {selectedQuote.client?.phone && <div>Téléphone: {selectedQuote.client.phone}</div>}
                      {selectedQuote.client?.email && <div>Email: {selectedQuote.client.email}</div>}
                    </>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <div className="mb-6">
                <h3 className="font-semibold text-slate-800 mb-3">Articles</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200">
                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">Référence</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">Désignation</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">Unité</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">Quantité</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">Prix Unitaire</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">Prix Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedQuote.items?.map((group) =>
                        group.designations.map((des) => (
                          <tr key={des.id} className="border-b border-slate-100">
                            <td className="px-3 py-2 text-sm">{group.reference || '—'}</td>
                            <td className="px-3 py-2 text-sm">{des.designation || '—'}</td>
                            <td className="px-3 py-2 text-sm">{des.unite || '—'}</td>
                            <td className="px-3 py-2 text-sm">{des.quantite || 0}</td>
                            <td className="px-3 py-2 text-sm">{des.prixUnitaire?.toFixed(2) || '0.00'} MAD</td>
                            <td className="px-3 py-2 text-sm font-medium">{des.prixTotal?.toFixed(2) || '0.00'} MAD</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals */}
              <div className="border-t border-slate-200 pt-4">
                <div className="flex justify-end">
                  <div className="w-80 space-y-2">
                    <div className="flex justify-between text-slate-700">
                      <span className="font-medium">Total HT:</span>
                      <span className="font-semibold">{selectedQuote.totalHT?.toFixed(2) || '0.00'} MAD</span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span className="font-medium">TVA (20%):</span>
                      <span className="font-semibold">{selectedQuote.tva?.toFixed(2) || '0.00'} MAD</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-slate-800 pt-2 border-t border-slate-200">
                      <span>Total TTC:</span>
                      <span>{selectedQuote.totalTTC?.toFixed(2) || '0.00'} MAD</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 border border-slate-300 rounded-lg transition-colors"
              >
                Fermer
              </button>
              <button
                onClick={() => handleGeneratePDF(selectedQuote)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                Télécharger PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
