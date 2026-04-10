import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Printer, Download, CheckCircle, Clock, FileText, Server, User, Building } from 'lucide-react';
import { TutorTooltip } from '../components/TutorTooltip';

const OrderDetails = () => {
  const { id } = useParams();
  const serviceNo = id || 'CL549486';

  const InfoField = ({ label, value }: { label: string, value: React.ReactNode }) => (
    <div className="py-3 border-b border-gray-50 last:border-0">
      <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{label}</dt>
      <dd className="text-sm font-medium text-gray-900">{value || '-'}</dd>
    </div>
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/orders" className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-serif font-bold text-gray-900">{serviceNo}</h1>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">Completed</span>
            </div>
            <p className="text-gray-500 mt-1">Order Receive Date: 19-Dec-23 • SRD: 21-Dec-23</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-600">
            <Printer className="w-5 h-5" />
          </button>
          <button className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-600">
            <Download className="w-5 h-5" />
          </button>
          <TutorTooltip text="Click here to modify the details of this order. You can update status, remarks, or correct any information." position="bottom">
            <button className="gradient-cta px-6 py-2.5 rounded-xl font-medium text-sm shadow-lg shadow-primary/20">
              Edit Order
            </button>
          </TutorTooltip>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Main Details */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Cloud Service Details */}
          <TutorTooltip text="This section contains the core technical details about the cloud service provisioned for this order." position="top">
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-4">
                <Server className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-serif font-bold text-gray-900">Cloud Service Details</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                <dl>
                  <InfoField label="Product Subscribe" value="AWS (Amazon Web Service)" />
                  <InfoField label="Order Type" value="New Install" />
                  <InfoField label="Service Type" value="-" />
                  <InfoField label="Billing Account / Master Account" value="7.59168E+11" />
                </dl>
                <dl>
                  <InfoField label="Account ID / Root ID / UID" value="-" />
                  <InfoField label="Account Name / Cloud Checker Name" value="-" />
                  <InfoField label="Account Login Email" value="-" />
                  <InfoField label="Other Account Information" value="-" />
                </dl>
              </div>
            </div>
          </TutorTooltip>

          {/* Provisioning & Tracking */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-4">
              <FileText className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-serif font-bold text-gray-900">Provisioning & Tracking</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
              <dl>
                <InfoField label="OASIS Number" value="CB23-00007546\1" />
                <InfoField label="CxS Request No." value="RN822908/1-2" />
                <InfoField label="TID" value="-" />
                <InfoField label="SD Number" value="-" />
              </dl>
              <dl>
                <InfoField label="PS Job (Y/N)" value="-" />
                <InfoField label="T2 / T3" value="-" />
                <InfoField label="Welcome Letter" value="Yes" />
                <InfoField label="Handled By" value="-" />
              </dl>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Remark / Logs</dt>
              <dd className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg whitespace-pre-wrap font-mono">
{`[19-Dec-2023] Received Order.
[02-Feb-2024] Confirm by Grace (Sale Team) Close CxS order on 05-Feb-2024`}
              </dd>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Order Form URL</dt>
              <dd className="text-sm text-primary hover:underline truncate">
                <a href="#" target="_blank" rel="noreferrer">http://10.10.10.209/OASIS_FILE_MANAGER/zip_files_download.php?...</a>
              </dd>
            </div>
          </div>

        </div>

        {/* Right Column: Customer & Timeline */}
        <div className="space-y-6">
          
          {/* Customer Info */}
          <TutorTooltip text="Quick details about the customer associated with this order. Click the customer name to view their full profile." position="left">
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-4">
                <Building className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-serif font-bold text-gray-900">Customer</h2>
              </div>
              <div className="mb-4">
                <Link to="/customers/CUST-001" className="text-lg font-medium text-primary hover:underline transition-colors block">
                  New World Corporate Services Limited
                </Link>
              </div>
              <dl className="space-y-3">
                <div>
                  <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Contact Person</dt>
                  <dd className="text-sm text-gray-900 flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    -
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Contact No.</dt>
                  <dd className="text-sm text-gray-900">-</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Contact Email</dt>
                  <dd className="text-sm text-gray-900">-</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Billing Address</dt>
                  <dd className="text-sm text-gray-900">-</dd>
                </div>
              </dl>
            </div>
          </TutorTooltip>

          {/* Timeline */}
          <TutorTooltip text="A chronological view of the order's lifecycle, from receipt to completion." position="left">
            <div className="card p-6">
              <h2 className="text-lg font-serif font-bold text-gray-900 mb-4">Timeline</h2>
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                
                <div className="relative flex items-start gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-green-500 text-white shadow shrink-0 z-10">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div className="pt-2">
                    <div className="font-bold text-gray-900 text-sm">CxS Completed</div>
                    <div className="text-xs text-gray-500">05-Feb-24</div>
                  </div>
                </div>
                
                <div className="relative flex items-start gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-blue-500 text-white shadow shrink-0 z-10">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="pt-2">
                    <div className="font-bold text-gray-900 text-sm">SRD</div>
                    <div className="text-xs text-gray-500">21-Dec-23</div>
                  </div>
                </div>

                <div className="relative flex items-start gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-gray-400 text-white shadow shrink-0 z-10">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="pt-2">
                    <div className="font-bold text-gray-900 text-sm">Order Received</div>
                    <div className="text-xs text-gray-500">19-Dec-23</div>
                  </div>
                </div>

              </div>
            </div>
          </TutorTooltip>

        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
