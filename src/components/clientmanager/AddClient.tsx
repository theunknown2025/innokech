import { useState } from 'react';
import { Building2, User, Save } from 'lucide-react';
import { pb } from '../../lib/pocketbase';

interface AddClientProps {
  onSuccess?: () => void;
}

export default function AddClient({ onSuccess }: AddClientProps) {
  const [type, setType] = useState<'personne_morale' | 'personne_physique'>('personne_morale');
  const [formData, setFormData] = useState({
    company_name: '',
    ice: '',
    company_address: '',
    company_phone: '',
    company_email: '',
    representative_name: '',
    representative_email: '',
    representative_phone: '',
    full_name: '',
    address: '',
    email: '',
    phone: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

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
      await pb.collection('clients').create(dataToSave);
      setSuccess(true);
      
      // Reset form
      setFormData({
        company_name: '',
        ice: '',
        company_address: '',
        company_phone: '',
        company_email: '',
        representative_name: '',
        representative_email: '',
        representative_phone: '',
        full_name: '',
        address: '',
        email: '',
        phone: '',
      });

      // Call onSuccess callback if provided
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 1500);
      }
    } catch (error: any) {
      console.error('Error saving client:', error);
      setError(error.message || 'Erreur lors de l\'enregistrement du client');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 md:p-8">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-6">Nouveau client</h2>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 text-sm font-medium">Client créé avec succès !</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client Type Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              Type de client *
            </label>
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
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/30"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Enregistrement...' : 'Enregistrer le client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
