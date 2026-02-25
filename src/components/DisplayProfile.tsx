import { Mail, Phone, MapPin } from 'lucide-react';

export interface CompanySettings {
  id?: string;
  logo?: string | string[];
  name?: string;
  address?: string;
  zipCode?: string;
  email?: string;
  phone?: string;
}

interface DisplayProfileProps {
  settings: CompanySettings | null;
  logoUrl?: string | null;
}

export default function DisplayProfile({ settings, logoUrl }: DisplayProfileProps) {
  if (!settings || (!settings.name && !settings.address && !settings.email && !settings.phone && !logoUrl)) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8">
        <p className="text-slate-500 text-center py-8">Aucune information de profil enregistrée. Cliquez sur « Créer le profil » pour ajouter vos informations.</p>
      </div>
    );
  }

  const fullAddress = [settings.address, settings.zipCode].filter(Boolean).join(', ');

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {logoUrl && (
            <div className="flex-shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-lg border border-slate-200 overflow-hidden bg-slate-50">
                <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
              </div>
            </div>
          )}
          <div className="flex-1 min-w-0 space-y-1">
            {settings.name && (
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800">{settings.name}</h2>
            )}
            {fullAddress && (
              <div className="flex items-start gap-2 text-slate-600">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-slate-500" />
                <span>{fullAddress}</span>
              </div>
            )}
            {settings.email && (
              <div className="flex items-center gap-2 text-slate-600">
                <Mail className="w-4 h-4 flex-shrink-0 text-slate-500" />
                <a href={`mailto:${settings.email}`} className="hover:text-blue-600">
                  {settings.email}
                </a>
              </div>
            )}
            {settings.phone && (
              <div className="flex items-center gap-2 text-slate-600">
                <Phone className="w-4 h-4 flex-shrink-0 text-slate-500" />
                <a href={`tel:${settings.phone}`} className="hover:text-blue-600">
                  {settings.phone}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
