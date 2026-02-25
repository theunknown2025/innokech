import { useState, useEffect, useCallback, useRef } from 'react';
import { Save, Image as ImageIcon, Pencil } from 'lucide-react';
import { pb } from '../lib/pocketbase';
import DisplayProfile from './DisplayProfile';

interface CompanySettings {
  id?: string;
  logo?: string | string[];
  name?: string;
  address?: string;
  zipCode?: string;
  email?: string;
  phone?: string;
}

export default function Profile() {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    zipCode: '',
    email: '',
    phone: '',
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const mountedRef = useRef(true);

  const fetchSettings = useCallback(async () => {
    if (!mountedRef.current) return;
    setLoading(true);
    setError(null);
    try {
      if (!pb.authStore.isValid) return;
      const result = await pb.collection('company_settings').getList<CompanySettings>(1, 1);
      const record = result.items[0] ?? null;
      if (mountedRef.current && record) {
        setSettings(record);
        setFormData({
          name: record.name ?? '',
          address: record.address ?? '',
          zipCode: record.zipCode ?? '',
          email: record.email ?? '',
          phone: record.phone ?? '',
        });
        if (record.logo) {
          const fn = typeof record.logo === 'string' ? record.logo : (record.logo as string[])[0];
          if (fn) setLogoPreview(pb.files.getUrl(record as any, fn));
        } else {
          setLogoPreview(null);
        }
      } else if (mountedRef.current) {
        setSettings(null);
        setFormData({ name: '', address: '', zipCode: '', email: '', phone: '' });
        setLogoPreview(null);
      }
    } catch (err: any) {
      if (mountedRef.current) {
        const code = err?.status ?? err?.data?.code;
        if (code === 404) {
          setSettings(null);
          setFormData({ name: '', address: '', zipCode: '', email: '', phone: '' });
        } else if (code === 400 || (err?.message || '').includes('collection')) {
          setError('La collection "company_settings" n\'existe pas. Créez-la dans PocketBase (voir MANUAL_SCHEMA_SETUP.md).');
        } else {
          setError(err?.message ?? 'Erreur lors du chargement');
        }
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchSettings();
    return () => { mountedRef.current = false; };
  }, [fetchSettings]);

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const data: Record<string, string | File> = {
        name: formData.name,
        address: formData.address,
        zipCode: formData.zipCode,
        email: formData.email,
        phone: formData.phone,
      };
      if (logoFile) data.logo = logoFile;

      if (settings?.id) {
        const fd = logoFile ? new FormData() : data;
        if (logoFile) {
          Object.entries(data).forEach(([k, v]) => fd.append(k, v as string | Blob));
          await pb.collection('company_settings').update(settings.id, fd);
        } else {
          await pb.collection('company_settings').update(settings.id, data);
        }
      } else {
        const fd = new FormData();
        Object.entries(data).forEach(([k, v]) => fd.append(k, v as string | Blob));
        const created = await pb.collection('company_settings').create(fd);
        setSettings({ ...created, id: created.id });
      }
      if (mountedRef.current) {
        setLogoFile(null);
        setIsEditing(false);
        fetchSettings();
        alert('Profil enregistré avec succès.');
      }
    } catch (err: any) {
      if (mountedRef.current) {
        setError(err?.message ?? 'Erreur lors de l\'enregistrement');
      }
    } finally {
      if (mountedRef.current) setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-slate-600">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Profile</h1>
          <p className="text-sm sm:text-base text-slate-600 mt-1">Informations de l'entreprise / administrateur</p>
        </div>

        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-slate-800">Aperçu du profil</h2>
            {!isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Pencil className="w-4 h-4" />
                {settings ? 'Modifier' : 'Créer le profil'}
              </button>
            )}
          </div>
          <DisplayProfile
            settings={settings}
            logoUrl={
              !isEditing
                ? settings?.logo
                  ? pb.files.getUrl(settings as any, typeof settings.logo === 'string' ? settings.logo : (settings.logo as string[])[0])
                  : null
                : null
            }
          />
        </div>

        {isEditing && (
          <>
            <h2 className="text-lg font-semibold text-slate-800 mb-3">Modifier le profil</h2>
            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 md:p-8">
          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8">
            <div className="flex-shrink-0">
              <label className="block text-sm font-medium text-slate-700 mb-2">Logo</label>
              <div className="relative">
                <div className="w-24 h-24 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <ImageIcon className="w-10 h-10 text-slate-400" />
                  )}
                </div>
                <div className="mt-2 flex gap-2">
                  <label className="cursor-pointer text-sm text-blue-600 hover:text-blue-700 font-medium">
                    Modifier
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoChange}
                    />
                  </label>
                  {(logoPreview || logoFile) && (
                    <button type="button" onClick={removeLogo} className="text-sm text-red-600 hover:text-red-700">
                      Supprimer
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-slate-800 mb-1">Informations de l'entreprise</h2>
              <p className="text-sm text-slate-500">Logo, nom, adresse et coordonnées</p>
            </div>
          </div>

          <div className="space-y-4 sm:space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nom *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ex: INOKECH HOLDING SARL"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Adresse</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ex: MHAMID 9 ABRAJ KOUTOUBIA GH 14 IMM 21 N 3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Code postal</label>
              <input
                type="text"
                value={formData.zipCode}
                onChange={(e) => handleChange('zipCode', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 max-w-xs"
                placeholder="Ex: 40000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 max-w-md"
                placeholder="contact@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 max-w-md"
                placeholder="Ex: +212 6 XX XX XX XX"
              />
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200 flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setError(null);
                setLogoFile(null);
                if (settings) {
                  setFormData({
                    name: settings.name ?? '',
                    address: settings.address ?? '',
                    zipCode: settings.zipCode ?? '',
                    email: settings.email ?? '',
                    phone: settings.phone ?? '',
                  });
                  if (settings.logo) {
                    const fn = typeof settings.logo === 'string' ? settings.logo : (settings.logo as string[])[0];
                    setLogoPreview(fn ? pb.files.getUrl(settings as any, fn) : null);
                  } else setLogoPreview(null);
                } else {
                  setFormData({ name: '', address: '', zipCode: '', email: '', phone: '' });
                  setLogoPreview(null);
                }
              }}
              className="px-5 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
            >
              Annuler
            </button>
          </div>
        </form>
          </>
        )}
      </div>
    </div>
  );
}
