import React from 'react';
import { HelpCircle, Mail, MessageSquare, Phone } from 'lucide-react';

const Help = () => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-serif font-bold text-gray-900">Help & Support</h1>
        <p className="text-gray-500 mt-1">How can we help you today?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 flex flex-col items-center text-center hover:shadow-md transition-shadow cursor-pointer">
          <div className="w-12 h-12 rounded-full bg-primary-light text-primary flex items-center justify-center mb-4">
            <Mail className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-gray-900 mb-2">Email Support</h3>
          <p className="text-sm text-gray-500">Get help via email within 24 hours.</p>
        </div>
        <div className="card p-6 flex flex-col items-center text-center hover:shadow-md transition-shadow cursor-pointer">
          <div className="w-12 h-12 rounded-full bg-primary-light text-primary flex items-center justify-center mb-4">
            <MessageSquare className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-gray-900 mb-2">Live Chat</h3>
          <p className="text-sm text-gray-500">Chat with our support team in real-time.</p>
        </div>
        <div className="card p-6 flex flex-col items-center text-center hover:shadow-md transition-shadow cursor-pointer">
          <div className="w-12 h-12 rounded-full bg-primary-light text-primary flex items-center justify-center mb-4">
            <Phone className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-gray-900 mb-2">Phone Support</h3>
          <p className="text-sm text-gray-500">Call us directly for urgent issues.</p>
        </div>
      </div>

      <div className="card p-8 mt-8">
        <h2 className="text-xl font-serif font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {[
            { q: 'How do I create a new order?', a: 'Navigate to the Order Registry and click the "New Order" button in the top right corner.' },
            { q: 'Can I export my customer list?', a: 'Yes, you can export your customer list by clicking the download icon on the Customers page.' },
            { q: 'How do I change my password?', a: 'Go to Settings > Profile Settings and click on "Change Password".' }
          ].map((faq, i) => (
            <div key={i} className="border-b border-gray-50 pb-4 last:border-0 last:pb-0">
              <h4 className="font-medium text-gray-900 mb-1 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-primary" />
                {faq.q}
              </h4>
              <p className="text-sm text-gray-500 pl-6">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Help;
