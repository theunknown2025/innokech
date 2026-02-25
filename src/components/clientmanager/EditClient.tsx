import { useState, useEffect } from 'react';
import { Building2, User, Save, ArrowLeft, X } from 'lucide-react';
import { pb, type ClientRecord } from '../../lib/pocketbase';

interface EditClientProps {
  client: ClientRecord;
  onBack: () => void;
  onSave: () => void;
}

export default function EditClient({ client, onBack, onSave }: EditClientProps) {
  const [type, setType] = useState<'personne_morale' | 'personne_physique'>(client.type);
  const [formData, setFormData] = useState({
    company_name: client.company_name || '',
    ice: client.ice || '',
    company_address: client.company_address || '',
    company_phone: client.company_phone || '',
    company_email: client.company_email || '',
    representative_name: client.representative_name || '',
    representative_email: client.representative_email || '',
    representative_phone: client.representative_phone || '',
    full_name: client.full_name || '',
    address: client.address || '',
    email: client.email || '',
    phone: client.phone || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

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
      await pb.collection('clients').update(client.id, dataToSave);
      onSave();
    } catch (error: any) {
      console.error('Error updating client:', error);
      setError(error.message || 'Erreur lors de la mise à jour du client');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Retour</span>
          </button>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Modifier le client</h2>
          <div className="w-20"></div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client Type Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">Type de client *</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setType('personne_morale')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  type === 'personne_morale'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <Building2 className="w-8 h-8 mx-auto mb-2" />
                <div className="font-medium">Personne Morale</div>
              </button>
              <button
                type="button"
                onClick={() => setType('personne_physique')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  type === 'personne_physique'
                    ? 'border-green-600 bg-green-50 text-green-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <User className="w-8 h-8 mx-auto mb-2" />
                <div className="font-medium">Personne Physique</div>
              </button>
            </div>
          </div>

          {/* Form Fields */}
          {type === 'personne_morale' ? (
            <>
              <div className="space-y-4 pt-4 border-t border-slate-200">
                <h3 className="font-semibold text-slate-800 text-lg">Informations de l'entreprise</h3>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nom de l'entreprise *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.company_name}
                    onChange={(e) => handleChange('company_name', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="Entrez le nom de l'entreprise"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">ICE</label>
                  <input
                    type="text"
                    value={formData.ice}
                    onChange={(e) => handleChange('ice', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="Numéro ICE"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Adresse</label>
                  <input
                    type="text"
                    value={formData.company_address}
                    onChange={(e) => handleChange('company_address', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="Adresse de l'entreprise"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Téléphone</label>
                    <input
                      type="tel"
                      value={formData.company_phone}
                      onChange={(e) => handleChange('company_phone', e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="+212 6XX XXX XXX"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={formData.company_email}
                      onChange={(e) => handleChange('company_email', e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="email@entreprise.com"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-6 border-t border-slate-200">
                <h3 className="font-semibold text-slate-800 text-lg">Représentant</h3>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Nom Complet</label>
                  <input
                    type="text"
                    value={formData.representative_name}
                    onChange={(e) => handleChange('representative_name', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="Nom du représentant"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={formData.representative_email}
                      onChange={(e) => handleChange('representative_email', e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="email@exemple.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Téléphone</label>
                    <input
                      type="tel"
                      value={formData.representative_phone}
                      onChange={(e) => handleChange('representative_phone', e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="+212 6XX XXX XXX"
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <h3 className="font-semibold text-slate-800 text-lg">Informations personnelles</h3>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Nom Complet *</label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => handleChange('full_name', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                  placeholder="Prénom et nom"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Adresse</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                  placeholder="Adresse complète"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                    placeholder="email@exemple.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Téléphone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                    placeholder="+212 6XX XXX XXX"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-4 pt-6 border-t border-slate-200">
            <button
              type="button"
              onClick={onBack}
              className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/30"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Enregistrement...' : 'Mettre à jour'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
