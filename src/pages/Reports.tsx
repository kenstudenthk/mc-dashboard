import React, { useState, useEffect, useMemo } from 'react';
import {
  PieChart, Pie, Cell,
  BarChart, Bar,
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Download, TrendingUp, Cloud, FileText,
  CheckCircle, Filter, AlertCircle, Mail,
} from 'lucide-react';
import { orderService, type Order } from '../services/orderService';

// ── Constants ─────────────────────────────────────────────────────────────────

const PROVIDER_COLORS: Record<string, string> = {
  'AWS': '#FF9900',
  'Azure': '#0089D6',
  'Huawei Cloud': '#C7000B',
  'AliCloud': '#FF6A00',
  'GCP': '#4285F4',
  'Tencent': '#00A4FF',
};
const FALLBACK_COLORS = ['#6366f1', '#14b8a6', '#f43f5e', '#84cc16', '#f59e0b', '#ec4899'];

const STATUS_STYLES: Record<string, { color: string; bg: string }> = {
  'Completed':       { color: 'text-green-600',  bg: 'bg-green-100'  },
  'Processing':      { color: 'text-yellow-600', bg: 'bg-yellow-100' },
  'Pending Issue':   { color: 'text-orange-600', bg: 'bg-orange-100' },
  'Account Created': { color: 'text-blue-600',   bg: 'bg-blue-100'   },
  'Cancelled':       { color: 'text-red-600',    bg: 'bg-red-100'    },
  'Active':          { color: 'text-teal-600',   bg: 'bg-teal-100'   },
};
const DEFAULT_STATUS = { color: 'text-gray-600', bg: 'bg-gray-100' };

const SELECT_CLASS =
  'bg-[#f5f5f7] border border-[#1d1d1f]/08 text-[#1d1d1f]/70 text-sm rounded-lg px-3 py-2 focus:ring-[#0071e3] focus:border-[#0071e3] outline-none';
const TOOLTIP_STYLE = {
  borderRadius: '8px', border: 'none',
  boxShadow: '0 2px 20px rgba(0,0,0,0.08)', fontSize: 12,
};
const AXIS_TICK = { fill: 'rgba(29,29,31,0.45)', fontSize: 11 };

// ── Helpers ───────────────────────────────────────────────────────────────────

function providerColor(name: string, index: number): string {
  return PROVIDER_COLORS[name] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

function parseDate(val: string | undefined): Date | null {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string | number;
  sub?: string;
}

function StatCard({ icon, iconBg, label, value, sub }: StatCardProps) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-xs font-medium text-[#1d1d1f]/45 truncate">{label}</div>
        <div
          className="text-[22px] font-semibold text-[#1d1d1f]"
          style={{ letterSpacing: '-0.28px' }}
        >
          {value}
        </div>
        {sub && <div className="text-[11px] text-[#1d1d1f]/40 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}

function ChartCard({ title, children, right }: ChartCardProps) {
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-5">
        <h2
          className="text-[17px] font-semibold text-[#1d1d1f]"
          style={{ letterSpacing: '-0.374px' }}
        >
          {title}
        </h2>
        {right}
      </div>
      {children}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

const Reports = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('All Time');
  const [provider, setProvider] = useState('All');

  useEffect(() => {
    orderService.findAll()
      .then(setOrders)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // ── Filtering ─────────────────────────────────────────────────────────────

  const filteredByTime = useMemo(() => {
    const now = new Date();
    return orders.filter(o => {
      if (timeRange === 'All Time') return true;
      const d = parseDate(o.OrderReceiveDate);
      if (!d) return false;
      if (timeRange === 'This Year') return d.getFullYear() === now.getFullYear();
      if (timeRange === 'Last 30 Days')
        return now.getTime() - d.getTime() <= 30 * 86_400_000;
      return true;
    });
  }, [orders, timeRange]);

  const filtered = useMemo(
    () => provider === 'All'
      ? filteredByTime
      : filteredByTime.filter(o => o.CloudProvider === provider),
    [filteredByTime, provider],
  );

  const providers = useMemo(
    () => [...new Set(orders.map(o => o.CloudProvider).filter(Boolean))].sort() as string[],
    [orders],
  );

  // ── KPI stats ─────────────────────────────────────────────────────────────

  const completedOrders = useMemo(
    () => filtered.filter(o => o.Status === 'Completed'),
    [filtered],
  );

  const pendingCount = useMemo(
    () => filtered.filter(o => o.Status === 'Processing' || o.Status === 'Pending Issue').length,
    [filtered],
  );

  const psJobRatio = useMemo(() => {
    if (!filtered.length) return '0.0';
    const n = filtered.filter(o => o.PSJob?.toLowerCase().startsWith('y')).length;
    return ((n / filtered.length) * 100).toFixed(1);
  }, [filtered]);

  const wlRate = useMemo(() => {
    if (!completedOrders.length) return 'N/A';
    const n = completedOrders.filter(o =>
      o.WelcomeLetter?.toLowerCase().includes('yes'),
    ).length;
    return `${((n / completedOrders.length) * 100).toFixed(1)}%`;
  }, [completedOrders]);

  const completionRate = useMemo(
    () => filtered.length ? ((completedOrders.length / filtered.length) * 100).toFixed(1) : '0.0',
    [filtered, completedOrders],
  );

  // ── Chart data ────────────────────────────────────────────────────────────

  const cloudProviderData = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach(o => {
      if (o.CloudProvider) map[o.CloudProvider] = (map[o.CloudProvider] ?? 0) + 1;
    });
    return Object.entries(map)
      .map(([name, value], i) => ({ name, value, color: providerColor(name, i) }))
      .sort((a, b) => b.value - a.value);
  }, [filtered]);

  const orderTypeData = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach(o => {
      if (o.OrderType) map[o.OrderType] = (map[o.OrderType] ?? 0) + 1;
    });
    return Object.entries(map)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [filtered]);

  // Monthly trend uses time filter only (not provider) to show full volume curve
  const monthlyTrend = useMemo(() => {
    const map: Record<string, number> = {};
    filteredByTime.forEach(o => {
      const d = parseDate(o.OrderReceiveDate);
      if (!d) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      map[key] = (map[key] ?? 0) + 1;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, count]) => {
        const [yr, mo] = key.split('-');
        const label = new Date(Number(yr), Number(mo) - 1)
          .toLocaleString('en', { month: 'short', year: '2-digit' });
        return { month: label, count };
      });
  }, [filteredByTime]);

  const serviceTypeData = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach(o => {
      if (o.ServiceType) map[o.ServiceType] = (map[o.ServiceType] ?? 0) + 1;
    });
    return Object.entries(map)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [filtered]);

  const avgProcessingData = useMemo(() => {
    const map: Record<string, number[]> = {};
    filtered.forEach(o => {
      const start = parseDate(o.OrderReceiveDate);
      const end = parseDate(o.CxSCompleteDate);
      if (!start || !end) return;
      const days = (end.getTime() - start.getTime()) / 86_400_000;
      if (days < 0) return;
      const p = o.CloudProvider ?? 'Unknown';
      (map[p] ??= []).push(days);
    });
    return Object.entries(map)
      .map(([prov, days]) => ({
        provider: prov,
        avgDays: Math.round(days.reduce((a, b) => a + b, 0) / days.length),
      }))
      .sort((a, b) => b.avgDays - a.avgDays);
  }, [filtered]);

  const statusSummary = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach(o => {
      if (o.Status) map[o.Status] = (map[o.Status] ?? 0) + 1;
    });
    return Object.entries(map)
      .map(([label, value]) => ({ label, value, ...(STATUS_STYLES[label] ?? DEFAULT_STATUS) }))
      .sort((a, b) => b.value - a.value);
  }, [filtered]);

  const topCustomers = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach(o => {
      if (o.CustomerName) map[o.CustomerName] = (map[o.CustomerName] ?? 0) + 1;
    });
    return Object.entries(map)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [filtered]);

  // ── CSV export ────────────────────────────────────────────────────────────

  const exportCSV = () => {
    const cols: (keyof Order)[] = [
      'Title', 'CustomerName', 'OrderType', 'Status', 'CloudProvider',
      'ServiceType', 'SRD', 'OrderReceiveDate', 'CxSCompleteDate', 'Amount',
    ];
    const rows = filtered.map(o =>
      cols.map(c => `"${String(o[c] ?? '').replace(/"/g, '""')}"`).join(','),
    );
    const csv = [cols.join(','), ...rows].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Loading / Error ───────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-[#1d1d1f]/45">Loading report data…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-red-500">Failed to load data: {error}</div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-[28px] font-semibold text-[#1d1d1f]"
            style={{ letterSpacing: '-0.28px', lineHeight: '1.1' }}
          >
            Reports & Analytics
          </h1>
          <p className="text-sm text-[#1d1d1f]/50 mt-1">
            Overview of cloud provisioning orders and service distribution.
          </p>
        </div>
        <button
          onClick={exportCSV}
          className="gradient-cta px-5 py-2 rounded-lg font-medium text-sm shadow-sm flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Filter Bar */}
      <div className="card p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-[#1d1d1f]/45 mr-1">
          <Filter className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">Filters:</span>
        </div>
        <select value={timeRange} onChange={e => setTimeRange(e.target.value)} className={SELECT_CLASS}>
          <option value="All Time">All Time</option>
          <option value="This Year">This Year</option>
          <option value="Last 30 Days">Last 30 Days</option>
        </select>
        <select value={provider} onChange={e => setProvider(e.target.value)} className={SELECT_CLASS}>
          <option value="All">All Providers</option>
          {providers.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <span className="ml-auto text-xs text-[#1d1d1f]/40">{filtered.length} orders matched</span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          icon={<FileText className="w-5 h-5 text-[#0071e3]" />}
          iconBg="bg-blue-50"
          label="Total Orders"
          value={filtered.length}
        />
        <StatCard
          icon={<CheckCircle className="w-5 h-5 text-green-600" />}
          iconBg="bg-green-50"
          label="Completed"
          value={completedOrders.length}
          sub={`${completionRate}% rate`}
        />
        <StatCard
          icon={<AlertCircle className="w-5 h-5 text-orange-500" />}
          iconBg="bg-orange-50"
          label="Pending"
          value={pendingCount}
          sub="Processing + Issues"
        />
        <StatCard
          icon={<Cloud className="w-5 h-5 text-purple-600" />}
          iconBg="bg-purple-50"
          label="Providers"
          value={cloudProviderData.length}
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5 text-indigo-600" />}
          iconBg="bg-indigo-50"
          label="PS Job Ratio"
          value={`${psJobRatio}%`}
        />
        <StatCard
          icon={<Mail className="w-5 h-5 text-teal-600" />}
          iconBg="bg-teal-50"
          label="Welcome Letter"
          value={wlRate}
          sub="of completed"
        />
      </div>

      {/* Row 1: Provider pie + Monthly trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title="Orders by Cloud Provider">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={cloudProviderData}
                  cx="50%" cy="50%"
                  innerRadius={75} outerRadius={110}
                  paddingAngle={4} dataKey="value"
                >
                  {cloudProviderData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Monthly Order Trend">
          {monthlyTrend.length === 0 ? (
            <div className="h-72 flex items-center justify-center text-sm text-[#1d1d1f]/35">
              No date data available
            </div>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrend} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(29,29,31,0.06)" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={AXIS_TICK} />
                  <YAxis axisLine={false} tickLine={false} tick={AXIS_TICK} allowDecimals={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Line
                    type="monotone" dataKey="count"
                    stroke="#0071e3" strokeWidth={2}
                    dot={{ r: 3, fill: '#0071e3' }} activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>
      </div>

      {/* Row 2: Order type + Service type */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title="Orders by Type">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={orderTypeData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(29,29,31,0.06)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={AXIS_TICK} />
                <YAxis axisLine={false} tickLine={false} tick={AXIS_TICK} allowDecimals={false} />
                <Tooltip cursor={{ fill: 'rgba(29,29,31,0.03)' }} contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="count" fill="#0071e3" radius={[4, 4, 0, 0]} barSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Orders by Service Type">
          {serviceTypeData.length === 0 ? (
            <div className="h-72 flex items-center justify-center text-sm text-[#1d1d1f]/35">
              No service type data
            </div>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={serviceTypeData} layout="vertical"
                  margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(29,29,31,0.06)" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={AXIS_TICK} allowDecimals={false} />
                  <YAxis
                    type="category" dataKey="name"
                    axisLine={false} tickLine={false}
                    tick={{ ...AXIS_TICK, fontSize: 10 }} width={100}
                  />
                  <Tooltip cursor={{ fill: 'rgba(29,29,31,0.03)' }} contentStyle={TOOLTIP_STYLE} />
                  <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>
      </div>

      {/* Avg processing time by provider */}
      {avgProcessingData.length > 0 && (
        <ChartCard title="Average Processing Time by Provider (days)">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={avgProcessingData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(29,29,31,0.06)" />
                <XAxis dataKey="provider" axisLine={false} tickLine={false} tick={AXIS_TICK} />
                <YAxis axisLine={false} tickLine={false} tick={AXIS_TICK} unit=" d" />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(v: number) => [`${v} days`, 'Avg']}
                />
                <Bar dataKey="avgDays" radius={[4, 4, 0, 0]} barSize={40}>
                  {avgProcessingData.map((entry, i) => (
                    <Cell key={i} fill={providerColor(entry.provider, i)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      )}

      {/* Status Breakdown */}
      <ChartCard
        title="Status Breakdown"
        right={
          <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{completionRate}% Completion Rate</span>
          </div>
        }
      >
        <div className="flex flex-wrap gap-3">
          {statusSummary.map((s, i) => (
            <div
              key={i}
              className="p-4 rounded-lg bg-[#f5f5f7] flex flex-col items-center justify-center text-center min-w-[90px]"
            >
              <div
                className={`w-11 h-11 rounded-full ${s.bg} ${s.color} flex items-center justify-center font-bold text-base mb-2.5`}
              >
                {s.value}
              </div>
              <div className="text-xs font-medium text-[#1d1d1f]/60">{s.label}</div>
            </div>
          ))}
        </div>
      </ChartCard>

      {/* Top Customers */}
      <ChartCard title="Top Customers by Order Count">
        <div className="space-y-2.5">
          {topCustomers.map((c, i) => {
            const pct = filtered.length > 0 ? (c.count / filtered.length) * 100 : 0;
            return (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-[#1d1d1f]/35 w-4 text-right shrink-0">{i + 1}</span>
                <span className="text-sm text-[#1d1d1f] w-48 truncate shrink-0">{c.name}</span>
                <div className="flex-1 h-2 bg-[#f5f5f7] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#0071e3] rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-[#1d1d1f] w-8 text-right shrink-0">
                  {c.count}
                </span>
              </div>
            );
          })}
        </div>
      </ChartCard>

    </div>
  );
};

export default Reports;
