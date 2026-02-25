import { useState, useEffect, useCallback, useRef } from 'react';
import { Pencil, Trash2, Building2, User, Eye, X } from 'lucide-react';
import { pb, type ClientRecord } from '../../lib/pocketbase';
import EditClient from './EditClient';
import ViewClient from './ViewClient';

export default function ClientList() {
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<ClientRecord | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'view' | 'edit'>('list');
  const mountedRef = useRef(true);

  const fetchClients = useCallback(async () => {
    if (!mountedRef.current) return;

    setLoading(true);
    setError(null);

    try {
      if (!pb.authStore.isValid) {
        throw new Error('Non authentifié. Veuillez vous reconnecter.');
      }

      let records: ClientRecord[] = [];
      
      // Try getFullList first without sort to avoid potential issues
      try {
        records = await pb.collection('clients').getFullList<ClientRecord>();
        // Sort client-side if needed
        records.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
      } catch (fullListError: any) {
        // If getFullList fails, try getList
        console.warn('getFullList failed, trying getList:', fullListError);
        try {
          // Try without sort parameter first
          const result = await pb.collection('clients').getList<ClientRecord>(1, 500);

          records = result.items;
          
          // Sort client-side
          records.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());

          if (result.totalPages > 1) {
            const allRecords = [...records];
            for (let page = 2; page <= result.totalPages; page++) {
              const pageResult = await pb.collection('clients').getList<ClientRecord>(page, 500);
              allRecords.push(...pageResult.items);
            }
            // Sort all records
            allRecords.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
            records = allRecords;
          }
        } catch (getListError: any) {
          // If both fail, check if it's a 400 error
          if (getListError?.status === 400 || fullListError?.status === 400) {
            console.error('400 error details:', {
              fullListError: fullListError?.data || fullListError?.message,
              getListError: getListError?.data || getListError?.message
            });
            throw new Error('Erreur de requête. Vérifiez que la collection "clients" existe et que vous êtes authentifié.');
          }
          // Otherwise throw the original error
          throw fullListError;
        }
      }

      if (mountedRef.current) {
        setClients(records);
        setLoading(false);
      }
    } catch (error: any) {
      if (error?.status === 0 || error?.message?.includes('aborted') || error?.message?.includes('cancelled')) {
        return;
      }

      console.error('Error fetching clients:', error);

      if (!mountedRef.current) return;

      if (error?.status === 400) {
        const errorMessage = error?.data?.message || error?.message || 'Erreur de requête';
        setError(`Erreur de requête: ${errorMessage}.`);
      } else if (error?.status === 401 || error?.status === 403) {
        setError('Vous n\'êtes pas autorisé à accéder à cette ressource.');
      } else if (error?.message?.includes('Non authentifié')) {
        setError('Session expirée. Veuillez vous reconnecter.');
      } else {
        setError('Erreur lors du chargement des clients.');
      }
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchClients();

    return () => {
      mountedRef.current = false;
    };
  }, [fetchClients]);

  const handleView = (client: ClientRecord) => {
    setSelectedClient(client);
    setViewMode('view');
  };

  const handleEdit = (client: ClientRecord) => {
    setSelectedClient(client);
    setViewMode('edit');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) return;

    try {
      await pb.collection('clients').delete(id);
      fetchClients();
      if (selectedClient?.id === id) {
        setSelectedClient(null);
        setViewMode('list');
      }
    } catch (error) {
      console.error('Error deleting client:', error);
      alert('Erreur lors de la suppression du client');
    }
  };

  const handleBackToList = () => {
    setSelectedClient(null);
    setViewMode('list');
  };

  const handleSaveSuccess = () => {
    fetchClients();
    handleBackToList();
  };

  if (viewMode === 'view' && selectedClient) {
    return <ViewClient client={selectedClient} onBack={handleBackToList} onEdit={() => handleEdit(selectedClient)} onDelete={() => handleDelete(selectedClient.id)} />;
  }

  if (viewMode === 'edit' && selectedClient) {
    return <EditClient client={selectedClient} onBack={handleBackToList} onSave={handleSaveSuccess} />;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-6">Liste des clients</h2>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
          <button
            onClick={fetchClients}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Réessayer
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : clients.length === 0 ? (
        <div className="text-center py-12">
          <User className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Aucun client</h3>
          <p className="text-sm text-slate-600">Aucun client n'a été enregistré pour le moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {clients.map((client) => (
            <div
              key={client.id}
              className="bg-slate-50 rounded-xl border border-slate-200 p-4 sm:p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      client.type === 'personne_morale'
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-green-100 text-green-600'
                    }`}
                  >
                    {client.type === 'personne_morale' ? (
                      <Building2 className="w-6 h-6" />
                    ) : (
                      <User className="w-6 h-6" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full inline-block ${
                        client.type === 'personne_morale'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {client.type === 'personne_morale' ? 'PM' : 'PP'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 sm:space-y-3 mb-4">
                {client.type === 'personne_morale' ? (
                  <>
                    <div className="min-w-0">
                      <h3 className="font-bold text-lg text-slate-800 break-words">
                        {client.company_name}
                      </h3>
                      {client.ice && (
                        <p className="text-sm text-slate-500 truncate">ICE: {client.ice}</p>
                      )}
                    </div>
                    {client.company_email && (
                      <p className="text-sm text-slate-600 truncate">{client.company_email}</p>
                    )}
                    {client.company_phone && (
                      <p className="text-sm text-slate-600 break-words">{client.company_phone}</p>
                    )}
                  </>
                ) : (
                  <>
                    <div className="min-w-0">
                      <h3 className="font-bold text-lg text-slate-800 break-words">
                        {client.full_name}
                      </h3>
                    </div>
                    {client.email && <p className="text-sm text-slate-600 truncate">{client.email}</p>}
                    {client.phone && <p className="text-sm text-slate-600 break-words">{client.phone}</p>}
                  </>
                )}
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-200">
                <button
                  onClick={() => handleView(client)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg font-medium transition-colors text-sm"
                >
                  <Eye className="w-4 h-4" />
                  Voir
                </button>
                <button
                  onClick={() => handleEdit(client)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors text-sm"
                >
                  <Pencil className="w-4 h-4" />
                  Modifier
                </button>
                <button
                  onClick={() => handleDelete(client.id)}
                  className="flex items-center justify-center gap-1 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-medium transition-colors text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
