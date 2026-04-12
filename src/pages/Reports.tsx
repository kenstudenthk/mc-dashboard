import React, { useState } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, TrendingUp, Cloud, FileText, CheckCircle, Filter } from 'lucide-react';

const Reports = () => {
  const [timeRange, setTimeRange] = useState('All Time');
  const [provider, setProvider] = useState('All');

  // Mock data based on the CSV provided
  const baseCloudProviderData = [
    { name: 'AWS', value: 55, color: '#FF9900' },
    { name: 'Azure', value: 22, color: '#0089D6' },
    { name: 'Huawei Cloud', value: 12, color: '#C7000B' },
    { name: 'AliCloud', value: 10, color: '#FF6A00' },
    { name: 'GCP', value: 5, color: '#4285F4' },
    { name: 'Tencent', value: 2, color: '#00A4FF' },
  ];

  const baseOrderTypeData = [
    { name: 'New Install', count: 85 },
    { name: 'Misc Change', count: 15 },
    { name: 'Termination', count: 8 },
    { name: 'Pre-Pro', count: 6 },
    { name: 'Renewal', count: 4 },
  ];

  const baseStatusSummary = [
    { label: 'Completed', value: 80, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Pending Issue', value: 15, color: 'text-orange-600', bg: 'bg-orange-100' },
    { label: 'Processing', value: 5, color: 'text-yellow-600', bg: 'bg-yellow-100' },
    { label: 'Account Created', value: 4, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Cancelled', value: 2, color: 'text-red-600', bg: 'bg-red-100' },
  ];

  // Apply filters (simulating dynamic data changes)
  const scale = timeRange === 'Last 30 Days' ? 0.3 : timeRange === 'This Year' ? 0.8 : 1;

  const cloudProviderData = baseCloudProviderData
    .filter(d => provider === 'All' || d.name.includes(provider))
    .map(d => ({ ...d, value: Math.max(1, Math.round(d.value * scale)) }));

  const orderTypeData = baseOrderTypeData.map(d => ({ ...d, count: Math.max(1, Math.round(d.count * scale * (provider !== 'All' ? 0.4 : 1))) }));

  const statusSummary = baseStatusSummary.map(d => ({ ...d, value: Math.max(0, Math.round(d.value * scale * (provider !== 'All' ? 0.4 : 1))) }));

  const totalOrders = orderTypeData.reduce((acc, curr) => acc + curr.count, 0);
  const totalCompleted = statusSummary.find(s => s.label === 'Completed')?.value || 0;
  const completionRate = totalOrders > 0 ? ((totalCompleted / totalOrders) * 100).toFixed(1) : '0.0';

  const selectClass = "bg-[#f5f5f7] border border-[#1d1d1f]/08 text-[#1d1d1f]/70 text-sm rounded-lg px-3 py-2 focus:ring-[#0071e3] focus:border-[#0071e3] outline-none";

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-[28px] font-semibold text-[#1d1d1f]"
            style={{ letterSpacing: "-0.28px", lineHeight: "1.1" }}
          >
            Reports & Analytics
          </h1>
          <p className="text-sm text-[#1d1d1f]/50 mt-1">
            Overview of cloud provisioning orders and service distribution.
          </p>
        </div>
        <button className="gradient-cta px-5 py-2 rounded-lg font-medium text-sm shadow-sm flex items-center gap-2">
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
        <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} className={selectClass}>
          <option value="All Time">All Time</option>
          <option value="This Year">This Year</option>
          <option value="Last 30 Days">Last 30 Days</option>
        </select>
        <select value={provider} onChange={(e) => setProvider(e.target.value)} className={selectClass}>
          <option value="All">All Providers</option>
          <option value="AWS">AWS</option>
          <option value="Azure">Azure</option>
          <option value="Huawei">Huawei Cloud</option>
          <option value="AliCloud">AliCloud</option>
          <option value="GCP">GCP</option>
          <option value="Tencent">Tencent</option>
        </select>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-[#0071e3]">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-[#1d1d1f]/45">Total Orders</div>
            <div
              className="text-[22px] font-semibold text-[#1d1d1f]"
              style={{ fontFamily: "SF Pro Display, Helvetica Neue, Helvetica, Arial, sans-serif", letterSpacing: "-0.28px" }}
            >
              {totalOrders}
            </div>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-[#1d1d1f]/45">Completed</div>
            <div
              className="text-[22px] font-semibold text-[#1d1d1f]"
              style={{ fontFamily: "SF Pro Display, Helvetica Neue, Helvetica, Arial, sans-serif", letterSpacing: "-0.28px" }}
            >
              {totalCompleted}
            </div>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-[#1d1d1f]/45">Active Cloud Services</div>
            <div
              className="text-[22px] font-semibold text-[#1d1d1f]"
              style={{ fontFamily: "SF Pro Display, Helvetica Neue, Helvetica, Arial, sans-serif", letterSpacing: "-0.28px" }}
            >
              {cloudProviderData.reduce((acc, curr) => acc + curr.value, 0)}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Cloud Provider Distribution */}
        <div className="card p-6">
          <h2 className="text-[17px] font-semibold text-[#1d1d1f] mb-5" style={{ letterSpacing: "-0.374px" }}>
            Orders by Cloud Provider
          </h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={cloudProviderData}
                  cx="50%"
                  cy="50%"
                  innerRadius={75}
                  outerRadius={110}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {cloudProviderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 20px rgba(0,0,0,0.08)', fontSize: 12 }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Types */}
        <div className="card p-6">
          <h2 className="text-[17px] font-semibold text-[#1d1d1f] mb-5" style={{ letterSpacing: "-0.374px" }}>
            Orders by Type
          </h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={orderTypeData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(29,29,31,0.06)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'rgba(29,29,31,0.45)', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(29,29,31,0.45)', fontSize: 11 }} />
                <Tooltip
                  cursor={{ fill: 'rgba(29,29,31,0.03)' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 20px rgba(0,0,0,0.08)', fontSize: 12 }}
                />
                <Bar dataKey="count" fill="#0071e3" radius={[4, 4, 0, 0]} barSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Summary */}
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[17px] font-semibold text-[#1d1d1f]" style={{ letterSpacing: "-0.374px" }}>
              Status Breakdown
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{completionRate}% Completion Rate</span>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {statusSummary.map((status, idx) => (
              <div key={idx} className="p-4 rounded-lg bg-[#f5f5f7] flex flex-col items-center justify-center text-center">
                <div className={`w-11 h-11 rounded-full ${status.bg} ${status.color} flex items-center justify-center font-bold text-base mb-2.5`}>
                  {status.value}
                </div>
                <div className="text-xs font-medium text-[#1d1d1f]/60">{status.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
