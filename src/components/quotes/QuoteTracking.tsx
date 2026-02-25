import { useState, useEffect, useCallback, useRef } from 'react';
import { MoreVertical, Building2, User, FileText, ExternalLink } from 'lucide-react';
import { pb } from '../../lib/pocketbase';
import type { QuoteRecord } from './QuoteList';

interface PaymentEntry {
  id: string;
  date: string;
  amount: number;
  // Stores the file URL from PocketBase (for opening/previewing) or filename as fallback
  proof?: string;
}

type QuoteWithPayments = QuoteRecord & {
  paidTotal?: number;
  payments?: PaymentEntry[];
  paymentProofFile?: string; // File URL from PocketBase
};

export default function QuoteTracking() {
  const [quotes, setQuotes] = useState<QuoteWithPayments[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<QuoteWithPayments | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentFile, setPaymentFile] = useState<File | null>(null);
  const [savingPayment, setSavingPayment] = useState(false);
  const mountedRef = useRef(true);

  const getClientName = (quote: QuoteWithPayments) => {
    if (!quote.client) return 'Client inconnu';

    // Reuse the same display logic as in QuoteList
    if (quote.client.type === 'personne_morale') {
      return quote.client.company_name || 'Client professionnel';
    }

    return quote.client.full_name || 'Client particulier';
  };

  const computePaidTotal = (quote: QuoteWithPayments) => {
    const paymentsTotal = (quote.payments || []).reduce(
      (sum, p) => sum + (typeof p.amount === 'number' ? p.amount : 0),
      0
    );
    const paid = typeof quote.paidTotal === 'number' ? quote.paidTotal : paymentsTotal;
    return paid;
  };

  const computeRemaining = (quote: QuoteWithPayments) => {
    const paid = computePaidTotal(quote);
    const total = typeof quote.totalTTC === 'number' ? quote.totalTTC : 0;
    const remaining = total - paid;
    return remaining < 0 ? 0 : remaining;
  };

  const fetchQuotes = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (!pb.authStore.isValid) {
        throw new Error(
          "Vous n'êtes pas authentifié. Veuillez vous reconnecter pour voir les devis/factures."
        );
      }

      const records: QuoteWithPayments[] = [];
      let page = 1;
      const perPage = 50;
      let totalPages = 1;

      while (page <= totalPages) {
        const pageResult = await pb.collection('quotes').getList<QuoteWithPayments>(page, perPage, {
          expand: 'clientId',
        });

        records.push(
          ...pageResult.items.map((item: any) => {
            const quote: QuoteWithPayments = {
              ...(item as QuoteWithPayments),
              client: (item.expand && item.expand.clientId) || null,
              paymentProofFile: item.paymentProofFile || undefined,
            };
            
            // Convert payment proof filenames to full URLs if they exist
            if (Array.isArray(quote.payments) && quote.paymentProofFile) {
              quote.payments = quote.payments.map((payment) => {
                // If proof is a filename (not a full URL), convert it to a URL
                if (payment.proof && !payment.proof.startsWith('http')) {
                  const fileField = quote.paymentProofFile;
                  const filename = typeof fileField === 'string' 
                    ? fileField 
                    : Array.isArray(fileField) 
                      ? (fileField as string[]).find((f: string) => f === payment.proof) || (fileField as string[])[0]
                      : null;
                  
                  if (filename) {
                    payment.proof = pb.files.getUrl(quote, filename);
                  }
                }
                return payment;
              });
            }
            
            return quote;
          })
        );

        totalPages = pageResult.totalPages;
        page += 1;
      }

      // Sort by created date descending
      records.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());

      if (!mountedRef.current) return;
      setQuotes(records);
    } catch (err: any) {
      if (!mountedRef.current) return;

      if (err?.isAbort) {
        return;
      }

      console.error('Error fetching quotes for tracking:', err);

      if (err?.status === 400) {
        setError(
          "Erreur 400 lors du chargement des devis/factures. Vérifiez la configuration de la collection 'quotes' dans PocketBase."
        );
      } else if (err?.status === 401 || err?.status === 403) {
        setError(
          "Accès non autorisé. Vérifiez que vous êtes bien connecté et que vous avez les droits nécessaires pour consulter les devis/factures."
        );
      } else {
        setError(
          "Impossible de charger les devis/factures pour le suivi. Veuillez vérifier que PocketBase est en cours d'exécution et réessayer."
        );
      }
    } finally {
      if (!mountedRef.current) return;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchQuotes();

    return () => {
      mountedRef.current = false;
    };
  }, [fetchQuotes]);

  const openUpdateModal = (quote: QuoteWithPayments) => {
    setSelectedQuote(quote);
    const remaining = computeRemaining(quote);
    setPaymentAmount(remaining > 0 ? remaining.toString() : '');
    setPaymentFile(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (savingPayment) return;
    setIsModalOpen(false);
    setSelectedQuote(null);
    setPaymentAmount('');
    setPaymentFile(null);
  };

  const handleSavePayment = async () => {
    if (!selectedQuote) return;

    const amount = parseFloat(paymentAmount.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) {
      alert('Veuillez saisir un montant valide supérieur à 0.');
      return;
    }

    const remainingBefore = computeRemaining(selectedQuote);
    if (amount > remainingBefore + 0.0001) {
      alert("Le montant saisi dépasse le reste à payer.");
      return;
    }

    setSavingPayment(true);
    try {
      const now = new Date().toISOString();

      const existingPayments: PaymentEntry[] = Array.isArray(selectedQuote.payments)
        ? selectedQuote.payments
        : [];

      const newPayment: PaymentEntry = {
        id: `pay_${Date.now()}`,
        date: now,
        amount,
        proof: paymentFile ? paymentFile.name : undefined,
      };

      const updatedPayments = [...existingPayments, newPayment];
      const newPaidTotal = computePaidTotal(selectedQuote) + amount;

      // Use FormData so we can send both JSON and an optional file.
      // IMPORTANT: the 'quotes' collection must have a file field named 'paymentProofFile'.
      const formData = new FormData();
      formData.append('payments', JSON.stringify(updatedPayments));
      formData.append('paidTotal', String(newPaidTotal));
      if (paymentFile) {
        formData.append('paymentProofFile', paymentFile);
      }

      const updatedRecord = await pb
        .collection('quotes')
        .update<QuoteWithPayments>(selectedQuote.id, formData);

      if (!mountedRef.current) return;

      // Get the file URL from PocketBase if a file was uploaded
      let fileUrl: string | undefined;
      if (paymentFile && updatedRecord.paymentProofFile) {
        // PocketBase file fields return the filename as a string or array
        // We need to construct the full URL using pb.files.getUrl()
        const fileField = updatedRecord.paymentProofFile;
        const filename = typeof fileField === 'string' 
          ? fileField 
          : Array.isArray(fileField) 
            ? (fileField as string[])[(fileField as string[]).length - 1] 
            : null;
        
        if (filename) {
          fileUrl = pb.files.getUrl(updatedRecord, filename);
        }
      }

      // Update the payment entry with the file URL if available
      const finalPayments = updatedPayments.map((p, idx) => {
        if (idx === updatedPayments.length - 1 && fileUrl) {
          // This is the newly added payment, update it with the file URL
          return { ...p, proof: fileUrl };
        }
        return p;
      });

      setQuotes((prev) =>
        prev.map((q) =>
          q.id === selectedQuote.id
            ? {
                ...q,
                ...updatedRecord,
                payments: finalPayments,
                paidTotal: newPaidTotal,
                paymentProofFile: updatedRecord.paymentProofFile,
              }
            : q
        )
      );

      closeModal();
    } catch (err: any) {
      console.error('Error saving payment:', err);
      alert(
        "Impossible d'enregistrer le paiement. Vérifiez que la collection 'quotes' contient bien les champs 'payments' (JSON), 'paidTotal' (number) et 'paymentProofFile' (file)."
      );
    } finally {
      if (!mountedRef.current) return;
      setSavingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold text-slate-800 mb-4">Suivi des paiements</h1>
        <p className="text-slate-600">Chargement des devis/factures...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold text-slate-800 mb-4">Suivi des paiements</h1>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Suivi des paiements</h1>
          <p className="text-slate-600 mt-1">
            Visualisez les montants payés et le reste à payer pour vos devis et factures.
          </p>
        </div>
      </div>

      {quotes.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-6 text-center text-slate-600">
          Aucun devis ou facture trouvé.
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Total TTC
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Montant payé
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Reste à payer
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {quotes.map((quote) => {
                  const paid = computePaidTotal(quote);
                  const remaining = computeRemaining(quote);

                  return (
                    <tr key={quote.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            quote.type === 'devis'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          <FileTypeIcon type={quote.type} className="w-3 h-3 mr-1.5" />
                          {quote.type === 'devis' ? 'Devis' : 'Facture'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <ClientTypeIcon client={quote.client} />
                          <div className="ml-3">
                            <div className="text-sm font-medium text-slate-900">
                              {getClientName(quote)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">
                        {quote.date
                          ? new Date(quote.date).toLocaleDateString('fr-FR')
                          : new Date(quote.created).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-slate-900 font-semibold">
                        {quote.totalTTC.toLocaleString('fr-FR', {
                          style: 'currency',
                          currency: 'MAD',
                        })}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-emerald-700">
                        {paid.toLocaleString('fr-FR', {
                          style: 'currency',
                          currency: 'MAD',
                        })}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-slate-900">
                        {remaining.toLocaleString('fr-FR', {
                          style: 'currency',
                          currency: 'MAD',
                        })}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <button
                          onClick={() => openUpdateModal(quote)}
                          className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 shadow-sm transition-colors"
                          title="Mise à jour"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isModalOpen && selectedQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4 p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-1">Mise à jour du paiement</h2>
            <p className="text-sm text-slate-600 mb-4">
              {selectedQuote.type === 'devis' ? 'Devis' : 'Facture'} · {getClientName(selectedQuote)}
            </p>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Total TTC</span>
                <span className="font-semibold text-slate-900">
                  {selectedQuote.totalTTC.toLocaleString('fr-FR', {
                    style: 'currency',
                    currency: 'MAD',
                  })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Montant déjà payé</span>
                <span className="font-medium text-emerald-700">
                  {computePaidTotal(selectedQuote).toLocaleString('fr-FR', {
                    style: 'currency',
                    currency: 'MAD',
                  })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Reste à payer</span>
                <span className="font-semibold text-slate-900">
                  {computeRemaining(selectedQuote).toLocaleString('fr-FR', {
                    style: 'currency',
                    currency: 'MAD',
                  })}
                </span>
              </div>
            </div>

            {Array.isArray(selectedQuote.payments) && selectedQuote.payments.length > 0 && (
              <div className="mb-5">
                <h3 className="text-sm font-medium text-slate-700 mb-2">
                  Historique des paiements
                </h3>
                <div className="max-h-40 overflow-y-auto border border-slate-100 rounded-lg">
                  <table className="min-w-full text-xs">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold text-slate-500 uppercase tracking-wide">
                          Date
                        </th>
                        <th className="px-3 py-2 text-right font-semibold text-slate-500 uppercase tracking-wide">
                          Montant
                        </th>
                        <th className="px-3 py-2 text-left font-semibold text-slate-500 uppercase tracking-wide">
                          Document
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {selectedQuote.payments
                        .slice()
                        .sort(
                          (a, b) =>
                            new Date(a.date).getTime() - new Date(b.date).getTime()
                        )
                        .map((payment) => (
                          <tr key={payment.id}>
                            <td className="px-3 py-1.5 text-slate-700">
                              {payment.date
                                ? new Date(payment.date).toLocaleDateString('fr-FR')
                                : '-'}
                            </td>
                            <td className="px-3 py-1.5 text-right text-slate-900">
                              {payment.amount.toLocaleString('fr-FR', {
                                style: 'currency',
                                currency: 'MAD',
                              })}
                            </td>
                            <td className="px-3 py-1.5">
                              {payment.proof ? (
                                <a
                                  href={payment.proof}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 hover:underline transition-colors px-2 py-1 rounded hover:bg-blue-50"
                                  title="Cliquer pour ouvrir le document"
                                >
                                  <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                                  <span className="truncate max-w-[100px]">
                                    {payment.proof.includes('/api/files/')
                                      ? payment.proof.split('/').pop() || 'Document'
                                      : payment.proof.includes('http')
                                      ? payment.proof.split('/').pop() || 'Document'
                                      : payment.proof}
                                  </span>
                                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                </a>
                              ) : (
                                <span className="text-xs text-slate-400">Aucun document</span>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Montant à ajouter
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500 text-sm"
                  placeholder="Ex: 500.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Preuve de paiement (document image ou PDF)
                </label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setPaymentFile(file);
                  }}
                  className="block w-full text-sm text-slate-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-slate-900 file:text-white hover:file:bg-slate-800"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Formats acceptés : images (JPG, PNG, ...) ou PDF.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors"
                disabled={savingPayment}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSavePayment}
                className="px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                disabled={savingPayment}
              >
                {savingPayment ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FileTypeIcon({
  type,
  className,
}: {
  type: 'devis' | 'facture';
  className?: string;
}) {
  return (
    <span className={className}>
      {/* Simple circle indicator; could be replaced with an actual icon */}
      <span
        className={`inline-block w-2 h-2 rounded-full ${
          type === 'devis' ? 'bg-blue-500' : 'bg-emerald-500'
        }`}
      />
    </span>
  );
}

function ClientTypeIcon({ client }: { client: any }) {
  const isCompany = client?.type === 'personne_morale';
  const Icon = isCompany ? Building2 : User;

  return (
    <div
      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        isCompany ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'
      }`}
    >
      <Icon className="w-4 h-4" />
    </div>
  );
}

