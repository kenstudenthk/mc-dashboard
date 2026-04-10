import React, { useState } from 'react';
import { Search, Filter, PlusCircle, Edit, Trash2, Clock, User, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

const AuditLog = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('All');

  // Mock audit log data
  const allLogs = [
    { id: 'LOG-1045', timestamp: '10-Apr-26 14:32:01', user: 'Eleanor Shellstrop', action: 'Create', orderId: 'CL559999', details: 'Created new Termination order for AWS' },
    { id: 'LOG-1044', timestamp: '10-Apr-26 10:15:44', user: 'Chidi Anagonye', action: 'Update', orderId: 'CL549670', details: 'Changed status from "Processing" to "Account Created"' },
    { id: 'LOG-1043', timestamp: '09-Apr-26 16:45:12', user: 'Tahani Al-Jamil', action: 'Delete', orderId: 'CL540001', details: 'Deleted duplicate order record' },
    { id: 'LOG-1042', timestamp: '09-Apr-26 09:22:30', user: 'Eleanor Shellstrop', action: 'Create', orderId: 'CL549395', details: 'Created new Install order for Microsoft Azure' },
    { id: 'LOG-1041', timestamp: '08-Apr-26 11:05:00', user: 'Jason Mendoza', action: 'Update', orderId: 'CL543425', details: 'Updated SRD to 11-Jan-24' },
    { id: 'LOG-1040', timestamp: '08-Apr-26 09:12:15', user: 'Michael', action: 'Update', orderId: 'CL545713', details: 'Marked order as Cancelled' },
    { id: 'LOG-1039', timestamp: '07-Apr-26 15:30:22', user: 'Eleanor Shellstrop', action: 'Create', orderId: 'CL548927', details: 'Created new Install order for Huawei Cloud' },
  ];

  const filteredLogs = allLogs.filter(log => {
    if (actionFilter !== 'All' && log.action !== actionFilter) return false;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !log.user.toLowerCase().includes(query) && 
        !log.orderId.toLowerCase().includes(query) &&
        !log.details.toLowerCase().includes(query)
      ) {
        return false;
      }
    }
    return true;
  });

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'Create': return <PlusCircle className="w-4 h-4" />;
      case 'Update': return <Edit className="w-4 h-4" />;
      case 'Delete': return <Trash2 className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'Create': return 'bg-green-100 text-green-700 border-green-200';
      case 'Update': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Delete': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-gray-900">Audit Log</h1>
          <p className="text-gray-500 mt-1">Track all system activities, modifications, and user actions.</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/50">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search by User, Service No, or Details..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select 
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="text-sm bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="All">All Actions</option>
                <option value="Create">Create</option>
                <option value="Update">Update</option>
                <option value="Delete">Delete</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-white">
                <th className="px-6 py-4 label-text text-gray-400 w-48">Date & Time</th>
                <th className="px-6 py-4 label-text text-gray-400 w-48">User</th>
                <th className="px-6 py-4 label-text text-gray-400 w-32">Action</th>
                <th className="px-6 py-4 label-text text-gray-400 w-40">Service No.</th>
                <th className="px-6 py-4 label-text text-gray-400">Details (What changed)</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      {log.timestamp}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary-light text-primary flex items-center justify-center text-xs font-bold">
                        {log.user.charAt(0)}
                      </div>
                      {log.user}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${getActionColor(log.action)}`}>
                        {getActionIcon(log.action)}
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-primary hover:underline">
                      {log.orderId !== '-' ? (
                        <Link to={`/orders/${log.orderId}`}>{log.orderId}</Link>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {log.details}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No audit logs found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
          <div>Showing {filteredLogs.length} entries</div>
          <div className="flex gap-1">
            <button className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50" disabled>Prev</button>
            <button className="px-3 py-1 bg-primary text-white rounded">1</button>
            <button className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50" disabled>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLog;
