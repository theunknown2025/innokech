import { useState, useEffect, useCallback, useRef } from 'react';
import { TrendingUp, Users, FileText, Activity, DollarSign, CreditCard } from 'lucide-react';
import { pb, type ClientRecord } from '../lib/pocketbase';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface QuoteRecord {
  id: string;
  type: 'devis' | 'facture';
  totalTTC: number;
  paidTotal?: number;
  payments?: Array<{
    id: string;
    date: string;
    amount: number;
    proof?: string;
  }>;
  date: string;
  created: string;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

type EvolutionPeriod = 'daily' | 'weekly' | 'monthly';

export default function Dashboard() {
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [quotes, setQuotes] = useState<QuoteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [evolutionPeriod, setEvolutionPeriod] = useState<EvolutionPeriod>('monthly');
  const mountedRef = useRef(true);

  // Calculate payment totals
  const computePaidTotal = (quote: QuoteRecord) => {
    const paymentsTotal = (quote.payments || []).reduce(
      (sum, p) => sum + (typeof p.amount === 'number' ? p.amount : 0),
      0
    );
    const paid = typeof quote.paidTotal === 'number' ? quote.paidTotal : paymentsTotal;
    return paid;
  };

  const computeRemaining = (quote: QuoteRecord) => {
    const paid = computePaidTotal(quote);
    const total = typeof quote.totalTTC === 'number' ? quote.totalTTC : 0;
    const remaining = total - paid;
    return remaining < 0 ? 0 : remaining;
  };

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

  // Fetch quotes
  const fetchQuotes = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      if (!pb.authStore.isValid) return;

      const records: QuoteRecord[] = [];
      let page = 1;
      const perPage = 50;
      let totalPages = 1;

      while (page <= totalPages) {
        const pageResult = await pb.collection('quotes').getList<QuoteRecord>(page, perPage);

        records.push(...pageResult.items);

        totalPages = pageResult.totalPages;
        page += 1;
      }

      records.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());

      if (mountedRef.current) {
        setQuotes(records);
      }
    } catch (err: any) {
      if (!mountedRef.current) return;
      console.error('Error fetching quotes:', err);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    setLoading(true);

    Promise.all([fetchClients(), fetchQuotes()]).finally(() => {
      if (mountedRef.current) {
        setLoading(false);
      }
    });

    return () => {
      mountedRef.current = false;
    };
  }, [fetchClients, fetchQuotes]);

  // Calculate statistics
  const totalClients = clients.length;
  const clientsMorale = clients.filter((c) => c.type === 'personne_morale').length;
  const clientsPhysique = clients.filter((c) => c.type === 'personne_physique').length;

  const totalPayments = quotes.reduce((sum, q) => sum + computePaidTotal(q), 0);
  const totalRestToPay = quotes.reduce((sum, q) => sum + computeRemaining(q), 0);
  const totalTTC = quotes.reduce((sum, q) => sum + (q.totalTTC || 0), 0);
  const totalDevis = quotes.filter((q) => q.type === 'devis').length;
  const totalFactures = quotes.filter((q) => q.type === 'facture').length;

  // Prepare data for charts
  // Clients breakdown (pie chart)
  const clientsData = [
    { name: 'Personnes morales', value: clientsMorale },
    { name: 'Personnes physiques', value: clientsPhysique },
  ];

  // Payments over time – daily (mois en cours), weekly or monthly (6 mois)
  const getEvolutionData = () => {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    if (evolutionPeriod === 'daily') {
      const bucketMap = new Map<string, { paid: number; rest: number; total: number; name: string }>();
      const lastDay = now.getDate();

      for (let d = 1; d <= lastDay; d++) {
        const date = new Date(now.getFullYear(), now.getMonth(), d);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        bucketMap.set(key, {
          paid: 0,
          rest: 0,
          total: 0,
          name: date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
        });
      }

      quotes.forEach((quote) => {
        const quoteDate = new Date(quote.date || quote.created);
        if (quoteDate >= firstOfMonth && quoteDate <= now) {
          const key = `${quoteDate.getFullYear()}-${String(quoteDate.getMonth() + 1).padStart(2, '0')}-${String(quoteDate.getDate()).padStart(2, '0')}`;
          const bucket = bucketMap.get(key);
          if (bucket) {
            bucket.paid += computePaidTotal(quote);
            bucket.rest += computeRemaining(quote);
            bucket.total += quote.totalTTC || 0;
          }
        }
      });

      return Array.from(bucketMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([, v]) => ({
          name: v.name,
          Payé: v.paid,
          'Reste à payer': v.rest,
          Total: v.total,
        }));
    }

    const bucketMap = new Map<string, { paid: number; rest: number; total: number; name: string }>();

    quotes.forEach((quote) => {
      const quoteDate = new Date(quote.date || quote.created);
      if (quoteDate >= sixMonthsAgo) {
        let key: string;
        let name: string;

        if (evolutionPeriod === 'weekly') {
          const d = new Date(quoteDate);
          const dayOfWeek = d.getDay() || 7;
          const monday = new Date(d);
          monday.setDate(d.getDate() - dayOfWeek + 1);
          key = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
          name = `Sem. ${monday.getDate()} ${monday.toLocaleDateString('fr-FR', { month: 'short' })}`;
        } else {
          key = `${quoteDate.getFullYear()}-${String(quoteDate.getMonth() + 1).padStart(2, '0')}`;
          name = quoteDate.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
        }

        const existing = bucketMap.get(key);
        const paid = computePaidTotal(quote);
        const rest = computeRemaining(quote);
        const total = quote.totalTTC || 0;

        if (existing) {
          existing.paid += paid;
          existing.rest += rest;
          existing.total += total;
        } else {
          bucketMap.set(key, { paid, rest, total, name });
        }
      }
    });

    return Array.from(bucketMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => ({
        name: v.name,
        Payé: v.paid,
        'Reste à payer': v.rest,
        Total: v.total,
      }));
  };

  const evolutionData = getEvolutionData();

  // Top clients by payments
  const getTopClients = () => {
    const clientPayments: { [key: string]: { name: string; paid: number; rest: number } } = {};

    quotes.forEach((quote) => {
      const clientId = quote.id; // This would need to be expanded from clientId relation
      // For now, we'll use a simplified version
      // In a real scenario, you'd expand the clientId relation
    });

    // Simplified: group by quote type for now
    return [
      { name: 'Devis', Payé: quotes.filter((q) => q.type === 'devis').reduce((s, q) => s + computePaidTotal(q), 0), 'Reste': quotes.filter((q) => q.type === 'devis').reduce((s, q) => s + computeRemaining(q), 0) },
      { name: 'Factures', Payé: quotes.filter((q) => q.type === 'facture').reduce((s, q) => s + computePaidTotal(q), 0), 'Reste': quotes.filter((q) => q.type === 'facture').reduce((s, q) => s + computeRemaining(q), 0) },
    ];
  };

  const topClientsData = getTopClients();

  const stats = [
    {
      label: 'Total Clients',
      value: totalClients.toLocaleString('fr-FR'),
      icon: Users,
      color: 'bg-blue-500',
      lightColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      label: 'Paiements reçus',
      value: totalPayments.toLocaleString('fr-FR', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }),
      icon: DollarSign,
      color: 'bg-emerald-500',
      lightColor: 'bg-emerald-50',
      textColor: 'text-emerald-600',
    },
    {
      label: 'Reste à payer',
      value: totalRestToPay.toLocaleString('fr-FR', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }),
      icon: CreditCard,
      color: 'bg-orange-500',
      lightColor: 'bg-orange-50',
      textColor: 'text-orange-600',
    },
    {
      label: 'Total TTC',
      value: totalTTC.toLocaleString('fr-FR', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }),
      icon: TrendingUp,
      color: 'bg-purple-500',
      lightColor: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
  ];

  if (loading) {
    return (
      <div className="p-4 sm:p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Tableau de bord</h1>
            <p className="text-sm sm:text-base text-slate-600 mt-1">Chargement des données...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Tableau de bord</h1>
          <p className="text-sm sm:text-base text-slate-600 mt-1">Vue d'ensemble de votre activité</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 sm:w-12 h-10 sm:h-12 ${stat.lightColor} rounded-lg flex items-center justify-center`}>
                    <Icon className={`w-5 sm:w-6 h-5 sm:h-6 ${stat.textColor}`} />
                  </div>
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-slate-600 mb-1">{stat.label}</p>
                  <p className="text-2xl sm:text-3xl font-bold text-slate-800">{stat.value}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Clients Breakdown Pie Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Répartition des clients</h2>
            {totalClients > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={clientsData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {clientsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-slate-400">
                Aucun client enregistré
              </div>
            )}
          </div>

          {/* Payments vs Rest to Pay Bar Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Paiements vs Reste à payer</h2>
            {quotes.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topClientsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => value.toLocaleString('fr-FR', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 })} />
                  <Legend />
                  <Bar dataKey="Payé" fill="#10b981" />
                  <Bar dataKey="Reste" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-slate-400">
                Aucune donnée disponible
              </div>
            )}
          </div>
        </div>

        {/* Payments Over Time Line Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <h2 className="text-lg font-semibold text-slate-800">
              Évolution des paiements
              {evolutionPeriod === 'daily'
                ? ` (${new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })})`
                : ' (6 derniers mois)'}
            </h2>
            <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
              {(['daily', 'weekly', 'monthly'] as const).map((period) => (
                <button
                  key={period}
                  type="button"
                  onClick={() => setEvolutionPeriod(period)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    evolutionPeriod === period
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  {period === 'daily' ? 'Quotidien' : period === 'weekly' ? 'Hebdomadaire' : 'Mensuel'}
                </button>
              ))}
            </div>
          </div>
          {evolutionData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={evolutionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: number) => value.toLocaleString('fr-FR', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 })} />
                <Legend />
                <Line type="monotone" dataKey="Payé" stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey="Reste à payer" stroke="#f59e0b" strokeWidth={2} />
                <Line type="monotone" dataKey="Total" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[350px] text-slate-400">
              Aucune donnée disponible pour cette période
            </div>
          )}
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">Devis</p>
                <p className="text-2xl font-bold text-slate-800">{totalDevis}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">Factures</p>
                <p className="text-2xl font-bold text-slate-800">{totalFactures}</p>
              </div>
              <Activity className="w-8 h-8 text-emerald-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">Taux de paiement</p>
                <p className="text-2xl font-bold text-slate-800">
                  {totalTTC > 0 ? ((totalPayments / totalTTC) * 100).toFixed(1) : 0}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
