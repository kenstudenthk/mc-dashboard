import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Printer,
  Download,
  CheckCircle,
  Clock,
  FileText,
  Server,
  Building,
} from "lucide-react";
import { TutorTooltip } from "../components/TutorTooltip";
import { orderService, Order } from "../services/orderService";
import {
  orderTimelineService,
  TimelineEvent,
} from "../services/orderTimelineService";

const formatDate = (iso: string): string => {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    const day = String(d.getDate()).padStart(2, "0");
    const month = d.toLocaleString("en-GB", { month: "short" });
    const year = String(d.getFullYear()).slice(2);
    return `${day}-${month}-${year}`;
  } catch {
    return iso;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "Completed":
      return "bg-green-100 text-green-700";
    case "Account Created":
      return "bg-blue-100 text-blue-700";
    case "Processing":
      return "bg-yellow-100 text-yellow-700";
    case "Cancelled":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const InfoField = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div className="py-3 border-b border-gray-50 last:border-0">
    <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
      {label}
    </dt>
    <dd className="text-sm font-medium text-gray-900">{value || "—"}</dd>
  </div>
);

const OrderDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      orderService.findByTitle(id),
      orderTimelineService.getByOrder(id),
    ])
      .then(([ord, events]) => {
        setOrder(ord);
        setTimeline(events);
      })
      .catch(() => setError("Failed to load order details."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400">
        Loading…
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex items-center justify-center py-24 text-red-500">
        {error ?? "Order not found."}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/orders"
            className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-serif font-bold text-gray-900">
                {order.Title}
              </h1>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.Status)}`}
              >
                {order.Status}
              </span>
            </div>
            <p className="text-gray-500 mt-1">SRD: {formatDate(order.SRD)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-600">
            <Printer className="w-5 h-5" />
          </button>
          <button className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-600">
            <Download className="w-5 h-5" />
          </button>
          <TutorTooltip
            text="Click here to modify the details of this order."
            position="bottom"
          >
            <button className="gradient-cta px-6 py-2.5 rounded-xl font-medium text-sm shadow-lg shadow-primary/20">
              Edit Order
            </button>
          </TutorTooltip>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <TutorTooltip
            text="This section contains the core technical details about the cloud service provisioned for this order."
            position="top"
          >
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-4">
                <Server className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-serif font-bold text-gray-900">
                  Cloud Service Details
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                <dl>
                  <InfoField
                    label="Product Subscribe"
                    value={order.CloudProvider}
                  />
                  <InfoField label="Order Type" value={order.OrderType} />
                  <InfoField label="Service Type" value="—" />
                  <InfoField
                    label="Amount"
                    value={`$${order.Amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
                  />
                </dl>
                <dl>
                  <InfoField
                    label="Account ID / Root ID / UID"
                    value={order.AccountID}
                  />
                  <InfoField
                    label="Account Name / Cloud Checker Name"
                    value="—"
                  />
                  <InfoField label="Account Login Email" value="—" />
                  <InfoField label="Other Account Information" value="—" />
                </dl>
              </div>
            </div>
          </TutorTooltip>

          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-4">
              <FileText className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-serif font-bold text-gray-900">
                Provisioning & Tracking
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
              <dl>
                <InfoField label="OASIS Number" value="—" />
                <InfoField label="CxS Request No." value="—" />
                <InfoField label="TID" value="—" />
                <InfoField label="SD Number" value="—" />
              </dl>
              <dl>
                <InfoField label="PS Job (Y/N)" value="—" />
                <InfoField label="T2 / T3" value="—" />
                <InfoField label="Welcome Letter" value="—" />
                <InfoField label="Handled By" value="—" />
              </dl>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <TutorTooltip
            text="Quick details about the customer associated with this order."
            position="left"
          >
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-4">
                <Building className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-serif font-bold text-gray-900">
                  Customer
                </h2>
              </div>
              <Link
                to={`/customers/${order.CustomerID}`}
                className="text-base font-medium text-primary hover:underline transition-colors block mb-3"
              >
                {order.CustomerName}
              </Link>
              <p className="text-xs text-gray-400">ID #{order.CustomerID}</p>
            </div>
          </TutorTooltip>

          <TutorTooltip
            text="A chronological view of the order's lifecycle."
            position="left"
          >
            <div className="card p-6">
              <h2 className="text-lg font-serif font-bold text-gray-900 mb-4">
                Timeline
              </h2>
              {timeline.length === 0 ? (
                <p className="text-sm text-gray-400">No timeline events yet.</p>
              ) : (
                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                  {timeline.map((event) => (
                    <div
                      key={event.id}
                      className="relative flex items-start gap-4"
                    >
                      <div
                        className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white text-white shadow shrink-0 z-10 ${event.Completed ? "bg-green-500" : "bg-blue-400"}`}
                      >
                        {event.Completed ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          <Clock className="w-5 h-5" />
                        )}
                      </div>
                      <div className="pt-2">
                        <div className="font-bold text-gray-900 text-sm">
                          {event.Title}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDate(event.EventDate)}
                        </div>
                        {event.Description && (
                          <div className="text-xs text-gray-500 mt-0.5">
                            {event.Description}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TutorTooltip>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
