import { Building2, User, ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { type ClientRecord } from '../../lib/pocketbase';

interface ViewClientProps {
  client: ClientRecord;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function ViewClient({ client, onBack, onEdit, onDelete }: ViewClientProps) {
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
            <span>Retour à la liste</span>
          </button>
          <div className="flex gap-2">
            <button
              onClick={onEdit}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm"
            >
              <Pencil className="w-4 h-4" />
              Modifier
            </button>
            <button
              onClick={onDelete}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-medium transition-colors text-sm"
            >
              <Trash2 className="w-4 h-4" />
              Supprimer
            </button>
          </div>
        </div>

        {/* Client Info */}
        <div className="space-y-6">
          {/* Type Badge */}
          <div className="flex items-center gap-4">
            <div
              className={`w-16 h-16 rounded-lg flex items-center justify-center ${
                client.type === 'personne_morale'
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-green-100 text-green-600'
              }`}
            >
              {client.type === 'personne_morale' ? (
                <Building2 className="w-8 h-8" />
              ) : (
                <User className="w-8 h-8" />
              )}
            </div>
            <div>
              <span
                className={`text-sm font-medium px-3 py-1 rounded-full inline-block ${
                  client.type === 'personne_morale'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-green-100 text-green-700'
                }`}
              >
                {client.type === 'personne_morale' ? 'Personne Morale' : 'Personne Physique'}
              </span>
            </div>
          </div>

          {client.type === 'personne_morale' ? (
            <>
              {/* Company Information */}
              <div className="border-t border-slate-200 pt-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Informations de l'entreprise</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-500">Nom de l'entreprise</label>
                    <p className="text-base text-slate-800 font-medium mt-1">{client.company_name || '-'}</p>
                  </div>
                  {client.ice && (
                    <div>
                      <label className="text-sm font-medium text-slate-500">ICE</label>
                      <p className="text-base text-slate-800 mt-1">{client.ice}</p>
                    </div>
                  )}
                  {client.company_address && (
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-slate-500">Adresse</label>
                      <p className="text-base text-slate-800 mt-1">{client.company_address}</p>
                    </div>
                  )}
                  {client.company_phone && (
                    <div>
                      <label className="text-sm font-medium text-slate-500">Téléphone</label>
                      <p className="text-base text-slate-800 mt-1">{client.company_phone}</p>
                    </div>
                  )}
                  {client.company_email && (
                    <div>
                      <label className="text-sm font-medium text-slate-500">Email</label>
                      <p className="text-base text-slate-800 mt-1">{client.company_email}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Representative Information */}
              {client.representative_name && (
                <div className="border-t border-slate-200 pt-6">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">Représentant</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-500">Nom Complet</label>
                      <p className="text-base text-slate-800 font-medium mt-1">{client.representative_name}</p>
                    </div>
                    {client.representative_email && (
                      <div>
                        <label className="text-sm font-medium text-slate-500">Email</label>
                        <p className="text-base text-slate-800 mt-1">{client.representative_email}</p>
                      </div>
                    )}
                    {client.representative_phone && (
                      <div>
                        <label className="text-sm font-medium text-slate-500">Téléphone</label>
                        <p className="text-base text-slate-800 mt-1">{client.representative_phone}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="border-t border-slate-200 pt-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Informations personnelles</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-500">Nom Complet</label>
                  <p className="text-base text-slate-800 font-medium mt-1">{client.full_name || '-'}</p>
                </div>
                {client.address && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-slate-500">Adresse</label>
                    <p className="text-base text-slate-800 mt-1">{client.address}</p>
                  </div>
                )}
                {client.email && (
                  <div>
                    <label className="text-sm font-medium text-slate-500">Email</label>
                    <p className="text-base text-slate-800 mt-1">{client.email}</p>
                  </div>
                )}
                {client.phone && (
                  <div>
                    <label className="text-sm font-medium text-slate-500">Téléphone</label>
                    <p className="text-base text-slate-800 mt-1">{client.phone}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
