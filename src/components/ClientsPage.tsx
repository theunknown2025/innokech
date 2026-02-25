import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Pencil, Trash2, Building2, User, Users } from 'lucide-react';
import { pb, type ClientRecord } from '../lib/pocketbase';

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchClients = useCallback(async () => {
    if (!mountedRef.current) return;

    setLoading(true);
    setError(null);
    
    try {
      // Verify authentication before making request
      if (!pb.authStore.isValid) {
        throw new Error('Non authentifié. Veuillez vous reconnecter.');
      }

      // Try getFullList first, fallback to getList if it fails
      let records: ClientRecord[];
      try {
        records = await pb.collection('clients').getFullList<ClientRecord>({
          sort: '-created',
        });
      } catch (fullListError: any) {
        // If getFullList fails, try getList with pagination
        console.warn('getFullList failed, trying getList:', fullListError);
        const result = await pb.collection('clients').getList<ClientRecord>(1, 500, {
          sort: '-created',
        });
        
        records = result.items;
        
        // If there are more records, fetch them
        if (result.totalPages > 1) {
          const allRecords = [...records];
          for (let page = 2; page <= result.totalPages; page++) {
            const pageResult = await pb.collection('clients').getList<ClientRecord>(page, 500, {
        sort: '-created',
      });
            allRecords.push(...pageResult.items);
          }
          records = allRecords;
        }
      }
      
      // Only update state if component is still mounted
      if (mountedRef.current) {
      setClients(records);
        setLoading(false);
      }
    } catch (error: any) {
      // Ignore abort/cancellation errors (common in React StrictMode)
      if (error?.status === 0 || error?.message?.includes('aborted') || error?.message?.includes('cancelled')) {
        return;
      }
      
      console.error('Error fetching clients:', error);
      
      // Only update state if component is still mounted
      if (!mountedRef.current) return;
      
      // Provide user-friendly error message
      if (error?.status === 400) {
        // More specific error message for 400 errors
        const errorMessage = error?.data?.message || error?.message || 'Erreur de requête';
        setError(`Erreur de requête: ${errorMessage}. Vérifiez que la collection "clients" existe et que vous avez les permissions nécessaires.`);
      } else if (error?.status === 401 || error?.status === 403) {
        setError('Vous n\'êtes pas autorisé à accéder à cette ressource. Veuillez vous reconnecter.');
      } else if (error?.message?.includes('Non authentifié')) {
        setError('Session expirée. Veuillez vous reconnecter.');
      } else {
        setError('Erreur lors du chargement des clients. Veuillez réessayer.');
      }
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchClients();

    // Cleanup: mark component as unmounted
    return () => {
      mountedRef.current = false;
    };
  }, [fetchClients]);

  const handleAddClient = () => {
    setEditingClient(null);
    setIsModalOpen(true);
  };

  const handleEditClient = (client: ClientRecord) => {
    setEditingClient(client);
    setIsModalOpen(true);
  };

  const handleDeleteClient = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) return;

    try {
      await pb.collection('clients').delete(id);
      fetchClients();
    } catch (error) {
      console.error('Error deleting client:', error);
      alert('Erreur lors de la suppression du client');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingClient(null);
  };

  const handleSaveClient = () => {
    fetchClients();
    handleCloseModal();
  };

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Clients</h1>
            <p className="text-sm sm:text-base text-slate-600 mt-1">Gérez vos clients et leurs informations</p>
          </div>
          <button
            onClick={handleAddClient}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-3 rounded-lg font-medium transition-colors shadow-lg shadow-blue-600/30 text-sm sm:text-base"
          >
            <Plus className="w-5 h-5" />
            Nouveau Client
          </button>
        </div>

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
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-12 text-center">
            <Users className="w-12 sm:w-16 h-12 sm:h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-slate-800 mb-2">Aucun client</h3>
            <p className="text-sm sm:text-base text-slate-600 mb-6">Commencez par ajouter votre premier client</p>
            <button
              onClick={handleAddClient}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-colors text-sm sm:text-base"
            >
              <Plus className="w-5 h-5" />
              Ajouter un client
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {clients.map((client) => (
              <div
                key={client.id}
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 sm:w-12 h-10 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${client.type === 'personne_morale'
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-green-100 text-green-600'
                        }`}
                    >
                      {client.type === 'personne_morale' ? (
                        <Building2 className="w-5 sm:w-6 h-5 sm:h-6" />
                      ) : (
                        <User className="w-5 sm:w-6 h-5 sm:h-6" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full inline-block ${client.type === 'personne_morale'
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
                        <h3 className="font-bold text-base sm:text-lg text-slate-800 break-words">{client.company_name}</h3>
                        {client.ice && <p className="text-xs sm:text-sm text-slate-500 truncate">ICE: {client.ice}</p>}
                      </div>
                      {client.company_email && (
                        <p className="text-xs sm:text-sm text-slate-600 truncate">{client.company_email}</p>
                      )}
                      {client.company_phone && (
                        <p className="text-xs sm:text-sm text-slate-600 break-words">{client.company_phone}</p>
                      )}
                      {client.representative_name && (
                        <div className="pt-2 sm:pt-3 border-t border-slate-100">
                          <p className="text-xs font-medium text-slate-500 mb-1">Représentant</p>
                          <p className="text-xs sm:text-sm font-medium text-slate-700 break-words">
                            {client.representative_name}
                          </p>
                          {client.representative_email && (
                            <p className="text-xs text-slate-600 truncate">{client.representative_email}</p>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="min-w-0">
                        <h3 className="font-bold text-base sm:text-lg text-slate-800 break-words">{client.full_name}</h3>
                      </div>
                      {client.email && <p className="text-xs sm:text-sm text-slate-600 truncate">{client.email}</p>}
                      {client.phone && <p className="text-xs sm:text-sm text-slate-600 break-words">{client.phone}</p>}
                      {client.address && <p className="text-xs sm:text-sm text-slate-600 break-words">{client.address}</p>}
                    </>
                  )}
                </div>

                <div className="flex gap-2 pt-3 sm:pt-4 border-t border-slate-100">
                  <button
                    onClick={() => handleEditClient(client)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors text-xs sm:text-sm"
                  >
                    <Pencil className="w-3 sm:w-4 h-3 sm:h-4" />
                    <span className="hidden sm:inline">Modifier</span>
                    <span className="sm:hidden">Éditer</span>
                  </button>
                  <button
                    onClick={() => handleDeleteClient(client.id)}
                    className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-medium transition-colors text-xs sm:text-sm"
                  >
                    <Trash2 className="w-3 sm:w-4 h-3 sm:h-4" />
                    <span className="hidden sm:inline">Supprimer</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <ClientModal
          client={editingClient}
          onClose={handleCloseModal}
          onSave={handleSaveClient}
        />
      )}
    </div>
  );
}

type ClientModalProps = {
  client: ClientRecord | null;
  onClose: () => void;
  onSave: () => void;
};

function ClientModal({ client, onClose, onSave }: ClientModalProps) {
  const [type, setType] = useState<'personne_morale' | 'personne_physique'>(
    client?.type || 'personne_morale'
  );
  const [formData, setFormData] = useState({
    company_name: client?.company_name || '',
    ice: client?.ice || '',
    company_address: client?.company_address || '',
    company_phone: client?.company_phone || '',
    company_email: client?.company_email || '',
    representative_name: client?.representative_name || '',
    representative_email: client?.representative_email || '',
    representative_phone: client?.representative_phone || '',
    full_name: client?.full_name || '',
    address: client?.address || '',
    email: client?.email || '',
    phone: client?.phone || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const dataToSave = {
      type,
      ...(type === 'personne_morale'
        ? {
          company_name: formData.company_name,
          ice: formData.ice,
          company_address: formData.company_address,
          company_phone: formData.company_phone,
          company_email: formData.company_email,
          representative_name: formData.representative_name,
          representative_email: formData.representative_email,
          representative_phone: formData.representative_phone,
          full_name: '',
          address: '',
          email: '',
          phone: '',
        }
        : {
          full_name: formData.full_name,
          address: formData.address,
          email: formData.email,
          phone: formData.phone,
          company_name: '',
          ice: '',
          company_address: '',
          company_phone: '',
          company_email: '',
          representative_name: '',
          representative_email: '',
          representative_phone: '',
        }),
    };

    try {
      if (client) {
        await pb.collection('clients').update(client.id, dataToSave);
      } else {
        await pb.collection('clients').create(dataToSave);
      }
      onSave();
    } catch (error) {
      console.error('Error saving client:', error);
      alert('Erreur lors de l\'enregistrement du client');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] sm:max-h-[95vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-4 sm:px-8 py-4 sm:py-6 rounded-t-2xl">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
            {client ? 'Modifier le client' : 'Nouveau client'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-8">
          <div className="mb-6">
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-3">
              Type de client
            </label>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() => setType('personne_morale')}
                className={`p-3 sm:p-4 rounded-lg border-2 transition-all ${type === 'personne_morale'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
              >
                <Building2 className="w-5 sm:w-6 h-5 sm:h-6 mx-auto mb-2" />
                <div className="font-medium text-xs sm:text-sm">Personne Morale</div>
              </button>
              <button
                type="button"
                onClick={() => setType('personne_physique')}
                className={`p-3 sm:p-4 rounded-lg border-2 transition-all ${type === 'personne_physique'
                    ? 'border-green-600 bg-green-50 text-green-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
              >
                <User className="w-5 sm:w-6 h-5 sm:h-6 mx-auto mb-2" />
                <div className="font-medium text-xs sm:text-sm">Personne Physique</div>
              </button>
            </div>
          </div>

          {type === 'personne_morale' ? (
            <>
              <div className="space-y-3 sm:space-y-4 mb-6">
                <h3 className="font-semibold text-slate-800 text-base sm:text-lg">Informations de l'entreprise</h3>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">
                    Nom de l'entreprise *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.company_name}
                    onChange={(e) => handleChange('company_name', e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                    placeholder="Entrez le nom de l'entreprise"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">ICE</label>
                  <input
                    type="text"
                    value={formData.ice}
                    onChange={(e) => handleChange('ice', e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                    placeholder="Numéro ICE"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">Adresse</label>
                  <input
                    type="text"
                    value={formData.company_address}
                    onChange={(e) => handleChange('company_address', e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                    placeholder="Adresse de l'entreprise"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">Téléphone</label>
                    <input
                      type="tel"
                      value={formData.company_phone}
                      onChange={(e) => handleChange('company_phone', e.target.value)}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                      placeholder="+212 6XX XXX XXX"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={formData.company_email}
                      onChange={(e) => handleChange('company_email', e.target.value)}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                      placeholder="email@entreprise.com"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3 sm:space-y-4 pt-6 border-t border-slate-200">
                <h3 className="font-semibold text-slate-800 text-base sm:text-lg">Représentant</h3>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">
                    Nom Complet
                  </label>
                  <input
                    type="text"
                    value={formData.representative_name}
                    onChange={(e) => handleChange('representative_name', e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                    placeholder="Nom du représentant"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={formData.representative_email}
                      onChange={(e) => handleChange('representative_email', e.target.value)}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                      placeholder="email@exemple.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">Téléphone</label>
                    <input
                      type="tel"
                      value={formData.representative_phone}
                      onChange={(e) => handleChange('representative_phone', e.target.value)}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                      placeholder="+212 6XX XXX XXX"
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              <h3 className="font-semibold text-slate-800 text-base sm:text-lg">Informations personnelles</h3>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">
                  Nom Complet *
                </label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => handleChange('full_name', e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm"
                  placeholder="Prénom et nom"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">Adresse</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm"
                  placeholder="Adresse complète"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm"
                    placeholder="email@exemple.com"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">Téléphone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm"
                    placeholder="+212 6XX XXX XXX"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 sm:px-6 py-2 sm:py-3 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors text-sm sm:text-base"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/30 text-sm sm:text-base"
            >
              {saving ? 'Enregistrement...' : client ? 'Mettre à jour' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
