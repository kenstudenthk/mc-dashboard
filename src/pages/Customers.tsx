import React from 'react';
import { Search, Filter, Mail, Phone, MoreHorizontal, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { TutorTooltip } from '../components/TutorTooltip';

const Customers = () => {
  const customers = [
    { id: 'CUST-001', name: 'New World Corporate Services Limited', email: 'donng@nwcs.com.hk', phone: '67594210', orders: 12, spent: '$12,450.00', status: 'Active' },
    { id: 'CUST-006', name: 'THE BANK OF EAST ASIA, LIMITED', email: 'yuenhl2@hkbea.com', phone: '36083307', orders: 24, spent: '$8,230.00', status: 'Active' },
    { id: 'CUST-007', name: 'DAIWA CAPITAL MARKETS HONG KONG LIMITED', email: 'ronald.tsang@hk.daiwacm.com', phone: '27738533', orders: 3, spent: '$1,890.00', status: 'Inactive' },
    { id: 'CUST-008', name: 'HOSPITAL AUTHORITY', email: 'ehrdvpportaldev@ha.org.hk', phone: '95198740', orders: 45, spent: '$34,120.00', status: 'Active' },
    { id: 'CUST-009', name: 'AIRPORT AUTHORITY', email: 'kerri.wong@hkairport.com', phone: '21833292', orders: 8, spent: '$5,300.00', status: 'Active' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-gray-900">Customers</h1>
          <p className="text-gray-500 mt-1">Manage your customer database and view their history.</p>
        </div>
        <TutorTooltip text="Click here to add a new customer to the database." position="bottom">
          <button className="gradient-cta px-6 py-2.5 rounded-xl font-medium text-sm shadow-lg shadow-primary/20">
            Add Customer
          </button>
        </TutorTooltip>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <TutorTooltip text="Search for a customer by their name, ID, email, or phone number." position="bottom" wrapperClass="relative">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search customers..." 
                className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-64 transition-all"
              />
            </div>
          </TutorTooltip>
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-4 label-text text-gray-400">Customer</th>
                <th className="px-6 py-4 label-text text-gray-400">Contact</th>
                <th className="px-6 py-4 label-text text-gray-400">Orders</th>
                <th className="px-6 py-4 label-text text-gray-400">Total Spent</th>
                <th className="px-6 py-4 label-text text-gray-400">Status</th>
                <th className="px-6 py-4 label-text text-gray-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-light text-primary flex items-center justify-center font-bold text-sm">
                        {customer.name.substring(0, 2).toUpperCase()}
                      </div>
                      <TutorTooltip text="Click the customer name to view their detailed profile, including order history and special notes." position="right">
                        <div>
                          <Link to={`/customers/${customer.id}`} className="font-medium text-primary hover:underline">{customer.name}</Link>
                          <div className="text-xs text-gray-500">{customer.id}</div>
                        </div>
                      </TutorTooltip>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                        {customer.email}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        {customer.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">{customer.orders}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{customer.spent}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      customer.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {customer.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link to={`/customers/${customer.id}`} className="p-2 text-gray-400 hover:text-primary hover:bg-primary-light rounded-lg transition-colors">
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Customers;
