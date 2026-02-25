import { FileText } from 'lucide-react';

export default function QuotesPage() {
  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Devis / Factures</h1>
          <p className="text-sm sm:text-base text-slate-600 mt-1">Gérez vos devis et factures</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-12 text-center">
          <FileText className="w-12 sm:w-16 h-12 sm:h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg sm:text-xl font-semibold text-slate-800 mb-2">Devis et Factures</h3>
          <p className="text-sm sm:text-base text-slate-600">Cette fonctionnalité sera disponible prochainement.</p>
        </div>
      </div>
    </div>
  );
}
