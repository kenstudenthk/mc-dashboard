import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, MapPin, Edit, ShoppingBag, DollarSign, Clock, Cloud, Save, X, StickyNote } from 'lucide-react';

const CustomerProfile = () => {
  const { id } = useParams();
  
  // Mock data based on the ID
  const customer = {
    id: id || 'CUST-001',
    name: id === 'CUST-006' ? 'THE BANK OF EAST ASIA, LIMITED' : 'New World Corporate Services Limited',
    email: id === 'CUST-006' ? 'yuenhl2@hkbea.com' : 'donng@nwcs.com.hk',
    phone: id === 'CUST-006' ? '36083307' : '67594210',
    address: id === 'CUST-006' ? '41/F, BEA Tower, Millennium City 5, No. 418 Kwun Tong Road, Kwun Tong, KLN' : '29/F, New World Tower, 16-18 Queen\'s Road Central',
    status: 'Active',
    joined: 'Jan 15, 2023',
    totalSpent: id === 'CUST-006' ? '$8,230.00' : '$12,450.00',
    totalOrders: id === 'CUST-006' ? 12 : 24,
    notes: id === 'CUST-006' ? 'VIP Client. Always CC their procurement team (procurement@hkbea.com) when sending invoices. They require strict SLA adherence for AWS provisioning.' : '',
    serviceBreakdown: id === 'CUST-006' ? [
      { name: 'AWS', count: 8, color: 'bg-orange-500' },
      { name: 'Azure', count: 3, color: 'bg-blue-500' },
      { name: 'AliCloud', count: 1, color: 'bg-orange-600' }
    ] : [
      { name: 'AWS', count: 15, color: 'bg-orange-500' },
      { name: 'Huawei Cloud', count: 7, color: 'bg-red-500' },
      { name: 'GCP', count: 2, color: 'bg-blue-400' }
    ],
    recentOrders: [
      { id: 'CL549486', date: '19-Dec-23', status: 'Completed', amount: 'AWS (Amazon Web Service)' },
      { id: 'CL545725', date: '28-Dec-23', status: 'Completed', amount: 'AWS (Amazon Web Service)' },
      { id: 'CL545713', date: '08-Jan-24', status: 'Cancelled', amount: 'AWS (Amazon Web Service)' },
    ]
  };

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    email: customer.email,
    phone: customer.phone,
    address: customer.address
  });

  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesData, setNotesData] = useState(customer.notes);

  const handleSave = () => {
    // In a real app, you would save to backend here
    setIsEditing(false);
  };

  const handleSaveNotes = () => {
    // In a real app, you would save to backend here
    setIsEditingNotes(false);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/customers" className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-serif font-bold text-gray-900">{customer.name}</h1>
            <p className="text-gray-500 mt-1">Customer ID: {customer.id} • Joined {customer.joined}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isEditing ? (
            <>
              <button onClick={() => setIsEditing(false)} className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-600" title="Cancel">
                <X className="w-5 h-5" />
              </button>
              <button onClick={handleSave} className="p-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20" title="Save Changes">
                <Save className="w-5 h-5" />
              </button>
            </>
          ) : (
            <button onClick={() => setIsEditing(true)} className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-600" title="Edit Profile">
              <Edit className="w-5 h-5" />
            </button>
          )}
          <Link to="/orders/new" className="gradient-cta px-6 py-2.5 rounded-xl font-medium text-sm shadow-lg shadow-primary/20 inline-flex items-center">
            New Order
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Info & Stats */}
        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-primary-light text-primary flex items-center justify-center font-bold text-2xl">
                {customer.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${customer.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                  {customer.status}
                </span>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="w-full">
                  {isEditing ? (
                    <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  ) : (
                    <div className="text-sm font-medium text-gray-900">{formData.email}</div>
                  )}
                  <div className="text-xs text-gray-500 mt-1">Email Address</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="w-full">
                  {isEditing ? (
                    <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  ) : (
                    <div className="text-sm font-medium text-gray-900">{formData.phone}</div>
                  )}
                  <div className="text-xs text-gray-500 mt-1">Phone Number</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="w-full">
                  {isEditing ? (
                    <textarea value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[60px]" />
                  ) : (
                    <div className="text-sm font-medium text-gray-900">{formData.address}</div>
                  )}
                  <div className="text-xs text-gray-500 mt-1">Shipping Address</div>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif font-bold text-gray-900">Service Distribution</h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-blue-100 text-blue-700">Total: {customer.totalOrders}</span>
            </div>
            <div className="space-y-3">
              {customer.serviceBreakdown.map((service, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${service.color}`}></div>
                    <span className="text-sm font-medium text-gray-700">{service.name}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{service.count}</span>
                </div>
              ))}
              
              {/* Visual Progress Bar */}
              <div className="w-full h-2 rounded-full bg-gray-100 flex overflow-hidden mt-4">
                {customer.serviceBreakdown.map((service, idx) => (
                  <div 
                    key={idx} 
                    className={`h-full ${service.color}`} 
                    style={{ width: `${(service.count / customer.totalOrders) * 100}%` }}
                    title={`${service.name}: ${service.count}`}
                  ></div>
                ))}
              </div>
            </div>
          </div>

          <div className="card p-6 grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <ShoppingBag className="w-4 h-4" />
                <span className="text-xs font-medium uppercase tracking-wider">Orders</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{customer.totalOrders}</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <DollarSign className="w-4 h-4" />
                <span className="text-xs font-medium uppercase tracking-wider">Spent</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{customer.totalSpent}</div>
            </div>
          </div>
        </div>

        {/* Right Column: Order History & Notes */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Special Notes Section */}
          <div className="card p-6 border-l-4 border-l-amber-400">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-amber-700">
                <StickyNote className="w-5 h-5" />
                <h2 className="text-lg font-serif font-bold">Special Notes & Instructions</h2>
              </div>
              <div className="flex items-center gap-2">
                {isEditingNotes ? (
                  <>
                    <button onClick={() => setIsEditingNotes(false)} className="p-2 text-gray-400 hover:text-gray-600 transition-colors" title="Cancel">
                      <X className="w-4 h-4" />
                    </button>
                    <button onClick={handleSaveNotes} className="px-3 py-1.5 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 transition-colors shadow-sm" title="Save Notes">
                      Save Notes
                    </button>
                  </>
                ) : (
                  <button onClick={() => setIsEditingNotes(true)} className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit Notes">
                    <Edit className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            
            <div className="bg-amber-50/50 rounded-xl p-4 min-h-[120px]">
              {isEditingNotes ? (
                <textarea 
                  value={notesData} 
                  onChange={e => setNotesData(e.target.value)} 
                  placeholder="Type any special instructions, paste email content, or add important notes about this customer here..."
                  className="w-full h-full min-h-[150px] px-3 py-2 text-sm bg-white border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/20 resize-y" 
                />
              ) : (
                <div className="text-sm text-gray-700 whitespace-pre-wrap">
                  {notesData ? notesData : <span className="text-gray-400 italic">No special notes added for this customer yet. Click the edit icon to add instructions or paste email content.</span>}
                </div>
              )}
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-serif font-bold text-gray-900">Order History</h2>
              <Link to="/orders" className="text-sm font-medium text-primary hover:underline">View All</Link>
            </div>
            
            <div className="space-y-4">
              {customer.recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-white group-hover:shadow-sm transition-all">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <div>
                      <Link to={`/orders/${order.id}`} className="font-medium text-gray-900 hover:text-primary transition-colors">
                        {order.id}
                      </Link>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                        <Clock className="w-3.5 h-3.5" />
                        {order.date}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900">{order.amount}</div>
                    <div className="mt-1">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                        order.status === 'Completed' ? 'bg-green-100 text-green-700' : 
                        order.status === 'Processing' ? 'bg-yellow-100 text-yellow-700' : 
                        order.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerProfile;
