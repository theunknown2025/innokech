import { useState, useEffect, useCallback, useRef } from 'react';
import { Save, FileText, Building2, User, Plus, Trash2, Search } from 'lucide-react';
import { pb, type ClientRecord } from '../../lib/pocketbase';

interface Designation {
  id: string;
  designation: string;
  unite: string;
  quantite: number;
  prixUnitaire: number;
  prixTotal: number;
}

interface ReferenceGroup {
  id: string;
  reference: string;
  designations: Designation[];
}

interface QuoteData {
  id?: string;
  type: 'devis' | 'facture';
  clientId: string;
  items: ReferenceGroup[];
  totalHT: number;
  tva: number;
  totalTTC: number;
  date?: string;
  docNumber?: string;
  saved: boolean;
  hasChanges: boolean;
}

export default function QuoteGenerator() {
  const [documentType, setDocumentType] = useState<'devis' | 'facture'>('devis');
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientRecord | null>(null);
  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [referenceGroups, setReferenceGroups] = useState<ReferenceGroup[]>([
    {
      id: '1',
      reference: '',
      designations: [
        { id: '1-1', designation: '', unite: '', quantite: 1, prixUnitaire: 0, prixTotal: 0 }
      ]
    }
  ]);
  const [savedQuote, setSavedQuote] = useState<QuoteData | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(true);

  // Fetch clients
  const fetchClients = useCallback(async () => {
    if (!mountedRef.current) return;
    
    try {
      if (!pb.authStore.isValid) return;
      
      let records: ClientRecord[] = [];
      try {
        records = await pb.collection('clients').getFullList<ClientRecord>();
      } catch (error: any) {
        try {
          const result = await pb.collection('clients').getList<ClientRecord>(1, 500);
          records = result.items;
          if (result.totalPages > 1) {
            for (let page = 2; page <= result.totalPages; page++) {
              const pageResult = await pb.collection('clients').getList<ClientRecord>(page, 500);
              records.push(...pageResult.items);
            }
          }
        } catch (e) {
          console.error('Error fetching clients:', e);
        }
      }
      
      if (mountedRef.current) {
        setClients(records);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchClients();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchClients]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowClientDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter clients based on search
  const filteredClients = clients.filter(client => {
    const searchLower = clientSearch.toLowerCase();
    if (client.type === 'personne_morale') {
      return client.company_name?.toLowerCase().includes(searchLower) ||
             client.ice?.toLowerCase().includes(searchLower) ||
             client.company_email?.toLowerCase().includes(searchLower);
    } else {
      return client.full_name?.toLowerCase().includes(searchLower) ||
             client.email?.toLowerCase().includes(searchLower) ||
             client.phone?.toLowerCase().includes(searchLower);
    }
  });

  // Calculate totals
  const calculateTotals = useCallback((groups: ReferenceGroup[]) => {
    const totalHT = groups.reduce((sum, group) => {
      const groupTotal = group.designations.reduce((groupSum, des) => groupSum + des.prixTotal, 0);
      return sum + groupTotal;
    }, 0);
    const tva = totalHT * 0.20;
    const totalTTC = totalHT + tva;
    return { totalHT, tva, totalTTC };
  }, []);

  // Update reference
  const updateReference = (groupId: string, value: string) => {
    setReferenceGroups(prevGroups => {
      const updated = prevGroups.map(group => {
        if (group.id === groupId) {
          return { ...group, reference: value };
        }
        return group;
      });
      
      if (!hasChanges && savedQuote) {
        setHasChanges(true);
      }
      
      return updated;
    });
  };

  // Update designation
  const updateDesignation = (groupId: string, designationId: string, field: keyof Designation, value: string | number) => {
    setReferenceGroups(prevGroups => {
      const updated = prevGroups.map(group => {
        if (group.id === groupId) {
          const updatedDesignations = group.designations.map(des => {
            if (des.id === designationId) {
              const updated = { ...des, [field]: value };
              if (field === 'quantite' || field === 'prixUnitaire') {
                updated.prixTotal = updated.quantite * updated.prixUnitaire;
              }
              return updated;
            }
            return des;
          });
          return { ...group, designations: updatedDesignations };
        }
        return group;
      });
      
      if (!hasChanges && savedQuote) {
        setHasChanges(true);
      }
      
      return updated;
    });
  };

  // Add new reference group
  const addReferenceGroup = () => {
    const newId = Date.now().toString();
    setReferenceGroups(prev => [...prev, {
      id: newId,
      reference: '',
      designations: [
        { id: `${newId}-1`, designation: '', unite: '', quantite: 1, prixUnitaire: 0, prixTotal: 0 }
      ]
    }]);
    if (!hasChanges && savedQuote) {
      setHasChanges(true);
    }
  };

  // Add designation to a reference group
  const addDesignation = (groupId: string) => {
    setReferenceGroups(prevGroups => {
      const updated = prevGroups.map(group => {
        if (group.id === groupId) {
          const newDesId = `${groupId}-${Date.now()}`;
          return {
            ...group,
            designations: [...group.designations, {
              id: newDesId,
              designation: '',
              unite: '',
              quantite: 1,
              prixUnitaire: 0,
              prixTotal: 0
            }]
          };
        }
        return group;
      });
      
      if (!hasChanges && savedQuote) {
        setHasChanges(true);
      }
      
      return updated;
    });
  };

  // Remove reference group
  const removeReferenceGroup = (groupId: string) => {
    if (referenceGroups.length > 1) {
      setReferenceGroups(prev => prev.filter(group => group.id !== groupId));
      if (!hasChanges && savedQuote) {
        setHasChanges(true);
      }
    }
  };

  // Remove designation
  const removeDesignation = (groupId: string, designationId: string) => {
    setReferenceGroups(prevGroups => {
      const updated = prevGroups.map(group => {
        if (group.id === groupId) {
          if (group.designations.length > 1) {
            return {
              ...group,
              designations: group.designations.filter(des => des.id !== designationId)
            };
          }
        }
        return group;
      });
      
      if (!hasChanges && savedQuote) {
        setHasChanges(true);
      }
      
      return updated;
    });
  };

  // Select client
  const handleSelectClient = (client: ClientRecord) => {
    setSelectedClient(client);
    setClientSearch('');
    setShowClientDropdown(false);
    if (!hasChanges && savedQuote) {
      setHasChanges(true);
    }
  };

  // Save quote
  const handleSave = async () => {
    if (!selectedClient) {
      alert('Veuillez sélectionner un client');
      return;
    }

    setSaving(true);
    try {
      const { totalHT, tva, totalTTC } = calculateTotals(referenceGroups);
      
      const quoteData = {
        type: documentType,
        clientId: selectedClient.id,
        client: selectedClient,
        items: referenceGroups,
        totalHT,
        tva,
        totalTTC,
        date: savedQuote?.date || new Date().toISOString(),
        docNumber: savedQuote?.docNumber
      };

      if (savedQuote?.id) {
        // Update existing quote
        await pb.collection('quotes').update(savedQuote.id, quoteData);
        setSavedQuote({ ...quoteData, id: savedQuote.id, docNumber: savedQuote.docNumber, saved: true, hasChanges: false });
      } else {
        // Create new quote
        const record = await pb.collection('quotes').create(quoteData);
        const year = new Date().getFullYear();
        const docNumber = `${documentType === 'devis' ? 'DEV' : 'FAC'}-${year}-${String(record.id).slice(-6).toUpperCase()}`;
        try {
          await pb.collection('quotes').update(record.id, { docNumber });
        } catch {
          // docNumber field may not exist in schema yet
        }
        setSavedQuote({ ...quoteData, id: record.id, docNumber, saved: true, hasChanges: false });
      }
      
      setHasChanges(false);
      alert('Document sauvegardé avec succès');
    } catch (error: any) {
      console.error('Error saving quote:', error);
      alert('Erreur lors de la sauvegarde: ' + (error.message || 'Erreur inconnue'));
    } finally {
      setSaving(false);
    }
  };

  // Generate PDF/Document
  const handleGenerate = async () => {
    if (!savedQuote || hasChanges) {
      alert('Veuillez sauvegarder le document avant de générer');
      return;
    }

    setGenerating(true);
    try {
      // Import and use DocGen
      const { generatePDF } = await import('./DocGen');
      const quoteData = {
        id: savedQuote.id,
        type: savedQuote.type,
        clientId: savedQuote.clientId,
        client: selectedClient,
        items: savedQuote.items,
        totalHT: savedQuote.totalHT,
        tva: savedQuote.tva,
        totalTTC: savedQuote.totalTTC,
        date: savedQuote.date || new Date().toISOString(),
        docNumber: savedQuote.docNumber,
        created: (savedQuote as any).created
      };
      await generatePDF(quoteData);
    } catch (error) {
      console.error('Error generating document:', error);
      alert('Erreur lors de la génération du document');
    } finally {
      setGenerating(false);
    }
  };

  const { totalHT, tva, totalTTC } = calculateTotals(referenceGroups);
  const canGenerate = savedQuote && !hasChanges && !saving;

  return (
    <div>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 md:p-8 space-y-6">
          {/* Document Type Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">Type de document *</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => {
                  setDocumentType('devis');
                  if (!hasChanges && savedQuote) setHasChanges(true);
                }}
                className={`p-4 rounded-lg border-2 transition-all ${
                  documentType === 'devis'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <FileText className="w-8 h-8 mx-auto mb-2" />
                <div className="font-medium">Devis</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setDocumentType('facture');
                  if (!hasChanges && savedQuote) setHasChanges(true);
                }}
                className={`p-4 rounded-lg border-2 transition-all ${
                  documentType === 'facture'
                    ? 'border-green-600 bg-green-50 text-green-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <FileText className="w-8 h-8 mx-auto mb-2" />
                <div className="font-medium">Facture</div>
              </button>
            </div>
          </div>

          {/* Client Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Client *</label>
            <div className="relative" ref={dropdownRef}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  value={clientSearch}
                  onChange={(e) => {
                    setClientSearch(e.target.value);
                    setShowClientDropdown(true);
                  }}
                  onFocus={() => setShowClientDropdown(true)}
                  placeholder="Rechercher un client..."
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              
              {showClientDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredClients.length > 0 ? (
                    filteredClients.map(client => (
                      <button
                        key={client.id}
                        type="button"
                        onClick={() => handleSelectClient(client)}
                        className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-b-0"
                      >
                        <div className="flex items-center gap-3">
                          {client.type === 'personne_morale' ? (
                            <Building2 className="w-5 h-5 text-blue-600" />
                          ) : (
                            <User className="w-5 h-5 text-green-600" />
                          )}
                          <div>
                            <div className="font-medium text-slate-800">
                              {client.type === 'personne_morale' ? client.company_name : client.full_name}
                            </div>
                            {client.type === 'personne_morale' && client.ice && (
                              <div className="text-sm text-slate-500">ICE: {client.ice}</div>
                            )}
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-slate-500 text-sm">Aucun client trouvé</div>
                  )}
                </div>
              )}
            </div>

            {/* Selected Client Info */}
            {selectedClient && (
              <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-start gap-3">
                  {selectedClient.type === 'personne_morale' ? (
                    <Building2 className="w-6 h-6 text-blue-600 mt-1" />
                  ) : (
                    <User className="w-6 h-6 text-green-600 mt-1" />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-800 mb-2">
                      {selectedClient.type === 'personne_morale' ? selectedClient.company_name : selectedClient.full_name}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-600">
                      {selectedClient.type === 'personne_morale' ? (
                        <>
                          {selectedClient.ice && <div>ICE: {selectedClient.ice}</div>}
                          {selectedClient.company_address && <div>Adresse: {selectedClient.company_address}</div>}
                          {selectedClient.company_phone && <div>Téléphone: {selectedClient.company_phone}</div>}
                          {selectedClient.company_email && <div>Email: {selectedClient.company_email}</div>}
                        </>
                      ) : (
                        <>
                          {selectedClient.address && <div>Adresse: {selectedClient.address}</div>}
                          {selectedClient.phone && <div>Téléphone: {selectedClient.phone}</div>}
                          {selectedClient.email && <div>Email: {selectedClient.email}</div>}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Items Table */}
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Articles</h3>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200">
                      <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700">
                        <div className="flex items-center gap-2">
                          <span>Référence</span>
                          <button
                            type="button"
                            onClick={addReferenceGroup}
                            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                            title="Ajouter une référence"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700">
                        <div className="flex items-center gap-2">
                          <span>Désignation</span>
                          <button
                            type="button"
                            onClick={() => {
                              // Add designation to the last reference group, or create one if none exists
                              if (referenceGroups.length > 0) {
                                const lastGroup = referenceGroups[referenceGroups.length - 1];
                                addDesignation(lastGroup.id);
                              } else {
                                addReferenceGroup();
                              }
                            }}
                            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                            title="Ajouter une désignation"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700">Unité</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700">Quantité</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700">Prix Unitaire</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700">Prix Total</th>
                      <th className="px-3 py-3 text-center text-xs font-semibold text-slate-700 w-12"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {referenceGroups.map((group, groupIndex) => (
                      group.designations.map((des, desIndex) => (
                        <tr key={`${group.id}-${des.id}`} className="border-b border-slate-200 hover:bg-slate-50">
                          {/* Reference Column - only show input in first row of each group */}
                          <td className="px-3 py-2 align-top">
                            {desIndex === 0 ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={group.reference}
                                  onChange={(e) => updateReference(group.id, e.target.value)}
                                  className="flex-1 px-2 py-1 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm font-medium"
                                  placeholder="Référence"
                                />
                                {referenceGroups.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeReferenceGroup(group.id)}
                                    className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                                    title="Supprimer la référence"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            ) : (
                              <div className="px-2 py-1 text-sm text-slate-400">
                                {group.reference || <span className="text-slate-300">—</span>}
                              </div>
                            )}
                          </td>
                          {/* Désignation Column */}
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={des.designation}
                              onChange={(e) => updateDesignation(group.id, des.id, 'designation', e.target.value)}
                              className="w-full px-2 py-1 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                              placeholder="Désignation"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={des.unite}
                              onChange={(e) => updateDesignation(group.id, des.id, 'unite', e.target.value)}
                              className="w-full px-2 py-1 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                              placeholder="Unité"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={des.quantite}
                              onChange={(e) => updateDesignation(group.id, des.id, 'quantite', parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={des.prixUnitaire}
                              onChange={(e) => updateDesignation(group.id, des.id, 'prixUnitaire', parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <div className="text-sm font-medium text-slate-800">
                              {des.prixTotal.toFixed(2)} MAD
                            </div>
                          </td>
                          <td className="px-3 py-2 text-center">
                            {group.designations.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeDesignation(group.id, des.id)}
                                className="text-red-600 hover:text-red-800 transition-colors"
                                title="Supprimer la désignation"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Totals */}
          <div className="border-t border-slate-200 pt-4">
            <div className="flex justify-end">
              <div className="w-full md:w-80 space-y-2">
                <div className="flex justify-between text-slate-700">
                  <span className="font-medium">Total HT:</span>
                  <span className="font-semibold">{totalHT.toFixed(2)} MAD</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span className="font-medium">TVA (20%):</span>
                  <span className="font-semibold">{tva.toFixed(2)} MAD</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-slate-800 pt-2 border-t border-slate-200">
                  <span>Total TTC:</span>
                  <span>{totalTTC.toFixed(2)} MAD</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !selectedClient}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/30"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={!canGenerate || generating}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-600/30"
            >
              <FileText className="w-5 h-5" />
              {generating ? 'Génération...' : 'Générer'}
            </button>
          </div>

          {hasChanges && savedQuote && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ Des modifications ont été apportées. Veuillez sauvegarder avant de générer.
              </p>
            </div>
          )}
        </div>
    </div>
  );
}
