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

  return (
    <div className="space-y-8 pb-12 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-500 mt-1">Overview of cloud provisioning orders and service distribution.</p>
        </div>
        <button className="gradient-cta px-6 py-2.5 rounded-xl font-medium text-sm shadow-lg shadow-primary/20 flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-gray-500 font-medium mr-2">
          <Filter className="w-4 h-4" />
          <span className="text-sm">Filters:</span>
        </div>
        
        <select 
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-primary focus:border-primary block px-3 py-2 outline-none"
        >
          <option value="All Time">All Time</option>
          <option value="This Year">This Year</option>
          <option value="Last 30 Days">Last 30 Days</option>
        </select>

        <select 
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-primary focus:border-primary block px-3 py-2 outline-none"
        >
          <option value="All">All Providers</option>
          <option value="AWS">AWS</option>
          <option value="Azure">Azure</option>
          <option value="Huawei">Huawei Cloud</option>
          <option value="AliCloud">AliCloud</option>
          <option value="GCP">GCP</option>
          <option value="Tencent">Tencent</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary-light flex items-center justify-center text-primary">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">Total Orders</div>
            <div className="text-2xl font-bold text-gray-900">{totalOrders}</div>
          </div>
        </div>
        <div className="card p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">Completed</div>
            <div className="text-2xl font-bold text-gray-900">{totalCompleted}</div>
          </div>
        </div>
        <div className="card p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <Cloud className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">Active Cloud Services</div>
            <div className="text-2xl font-bold text-gray-900">{cloudProviderData.reduce((acc, curr) => acc + curr.value, 0)}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Cloud Provider Distribution */}
        <div className="card p-6">
          <h2 className="text-lg font-serif font-bold text-gray-900 mb-6">Orders by Cloud Provider</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={cloudProviderData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {cloudProviderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Types */}
        <div className="card p-6">
          <h2 className="text-lg font-serif font-bold text-gray-900 mb-6">Orders by Type</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={orderTypeData}
                margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: '#f9fafb' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Summary */}
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-serif font-bold text-gray-900">Status Breakdown</h2>
            <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
              <TrendingUp className="w-4 h-4" />
              <span>{completionRate}% Completion Rate</span>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {statusSummary.map((status, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 flex flex-col items-center justify-center text-center">
                <div className={`w-12 h-12 rounded-full ${status.bg} ${status.color} flex items-center justify-center font-bold text-lg mb-3`}>
                  {status.value}
                </div>
                <div className="text-sm font-medium text-gray-700">{status.label}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Reports;
