import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Mail,
  Phone,
  Edit,
  ShoppingBag,
  DollarSign,
  Clock,
  Save,
  X,
  StickyNote,
} from "lucide-react";
import { TutorTooltip } from "../components/TutorTooltip";
import { customerService, Customer } from "../services/customerService";
import { orderService, Order } from "../services/orderService";

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

const PROVIDER_COLORS: Record<string, string> = {
  AWS: "bg-orange-500",
  Azure: "bg-blue-500",
  Huawei: "bg-red-500",
  GCP: "bg-blue-400",
  Alibaba: "bg-orange-600",
  Tencent: "bg-cyan-500",
};

const CustomerProfile = () => {
  const { id } = useParams<{ id: string }>();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ email: "", phone: "" });

  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesData, setNotesData] = useState("");

  useEffect(() => {
    if (!id) return;
    Promise.all([customerService.findById(Number(id)), orderService.findAll()])
      .then(([cust, allOrders]) => {
        setCustomer(cust);
        setFormData({ email: cust.Email, phone: cust.Phone });
        setNotesData(cust.SpecialNotes || "");
        setOrders(allOrders.filter((o) => o.CustomerID === cust.id));
      })
      .catch(() => setError("Failed to load customer details."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = () => setIsEditing(false);
  const handleSaveNotes = () => setIsEditingNotes(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400">
        Loading…
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="flex items-center justify-center py-24 text-red-500">
        {error ?? "Customer not found."}
      </div>
    );
  }

  // Derive stats from orders
  const totalOrders = orders.length;
  const totalSpent = orders.reduce((sum, o) => sum + (o.Amount || 0), 0);

  const providerCounts = orders.reduce<Record<string, number>>((acc, o) => {
    const key = o.CloudProvider || "Other";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const serviceBreakdown = Object.entries(providerCounts).map(
    ([name, count]) => ({
      name,
      count: count as number,
      color: PROVIDER_COLORS[name] || "bg-gray-400",
    }),
  );

  const recentOrders = orders.slice(0, 5);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/customers"
            className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-serif font-bold text-gray-900">
              {customer.Title}
            </h1>
            <p className="text-gray-500 mt-1">Customer ID: #{customer.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-600"
                title="Cancel"
              >
                <X className="w-5 h-5" />
              </button>
              <button
                onClick={handleSave}
                className="p-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                title="Save Changes"
              >
                <Save className="w-5 h-5" />
              </button>
            </>
          ) : (
            <TutorTooltip
              text="Click here to edit the customer's contact information."
              position="bottom"
            >
              <button
                onClick={() => setIsEditing(true)}
                className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-600"
                title="Edit Profile"
              >
                <Edit className="w-5 h-5" />
              </button>
            </TutorTooltip>
          )}
          <TutorTooltip
            text="Quickly start a new order specifically for this customer."
            position="bottom"
          >
            <Link
              to="/orders/new"
              className="gradient-cta px-6 py-2.5 rounded-xl font-medium text-sm shadow-lg shadow-primary/20 inline-flex items-center"
            >
              New Order
            </Link>
          </TutorTooltip>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Info & Stats */}
        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-primary-light text-primary flex items-center justify-center font-bold text-2xl">
                {customer.Title.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${customer.Status === "Active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}
                >
                  {customer.Status}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="w-full">
                  {isEditing ? (
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  ) : (
                    <div className="text-sm font-medium text-gray-900">
                      {formData.email || "—"}
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mt-1">
                    Email Address
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="w-full">
                  {isEditing ? (
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="w-full px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  ) : (
                    <div className="text-sm font-medium text-gray-900">
                      {formData.phone || "—"}
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mt-1">Phone Number</div>
                </div>
              </div>
            </div>
          </div>

          {serviceBreakdown.length > 0 && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif font-bold text-gray-900">
                  Service Distribution
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-blue-100 text-blue-700">
                  Total: {totalOrders}
                </span>
              </div>
              <div className="space-y-3">
                {serviceBreakdown.map((service, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${service.color}`}
                      ></div>
                      <span className="text-sm font-medium text-gray-700">
                        {service.name}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">
                      {service.count}
                    </span>
                  </div>
                ))}
                {totalOrders > 0 && (
                  <div className="w-full h-2 rounded-full bg-gray-100 flex overflow-hidden mt-4">
                    {serviceBreakdown.map((service, idx) => (
                      <div
                        key={idx}
                        className={`h-full ${service.color}`}
                        style={{
                          width: `${(service.count / totalOrders) * 100}%`,
                        }}
                        title={`${service.name}: ${service.count}`}
                      ></div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="card p-6 grid grid-cols-2 gap-4">
            <TutorTooltip
              text="Total number of orders placed by this customer."
              position="bottom"
            >
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center gap-2 text-gray-500 mb-2">
                  <ShoppingBag className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">
                    Orders
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {totalOrders}
                </div>
              </div>
            </TutorTooltip>
            <TutorTooltip
              text="Total amount spent by this customer across all orders."
              position="bottom"
            >
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center gap-2 text-gray-500 mb-2">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">
                    Spent
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  $
                  {totalSpent.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
                </div>
              </div>
            </TutorTooltip>
          </div>
        </div>

        {/* Right Column: Order History & Notes */}
        <div className="lg:col-span-2 space-y-6">
          {/* Special Notes Section */}
          <TutorTooltip
            text="Use this section to store important, customer-specific information, such as special billing instructions or SLA requirements."
            position="left"
          >
            <div className="card p-6 border-l-4 border-l-amber-400">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-amber-700">
                  <StickyNote className="w-5 h-5" />
                  <h2 className="text-lg font-serif font-bold">
                    Special Notes & Instructions
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  {isEditingNotes ? (
                    <>
                      <button
                        onClick={() => setIsEditingNotes(false)}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Cancel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleSaveNotes}
                        className="px-3 py-1.5 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 transition-colors shadow-sm"
                        title="Save Notes"
                      >
                        Save Notes
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditingNotes(true)}
                      className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                      title="Edit Notes"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-amber-50/50 rounded-xl p-4 min-h-[120px]">
                {isEditingNotes ? (
                  <textarea
                    value={notesData}
                    onChange={(e) => setNotesData(e.target.value)}
                    placeholder="Type any special instructions, paste email content, or add important notes about this customer here..."
                    className="w-full h-full min-h-[150px] px-3 py-2 text-sm bg-white border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/20 resize-y"
                  />
                ) : (
                  <div className="text-sm text-gray-700 whitespace-pre-wrap">
                    {notesData ? (
                      notesData
                    ) : (
                      <span className="text-gray-400 italic">
                        No special notes added for this customer yet. Click the
                        edit icon to add instructions or paste email content.
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </TutorTooltip>

          <TutorTooltip
            text="A quick view of the customer's most recent orders. Click 'View All' to see their complete order history."
            position="left"
          >
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-serif font-bold text-gray-900">
                  Order History
                </h2>
                <Link
                  to="/orders"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  View All
                </Link>
              </div>

              {recentOrders.length === 0 ? (
                <p className="text-sm text-gray-400">
                  No orders found for this customer.
                </p>
              ) : (
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-white group-hover:shadow-sm transition-all">
                          <ShoppingBag className="w-4 h-4" />
                        </div>
                        <div>
                          <Link
                            to={`/orders/${order.Title}`}
                            className="font-medium text-gray-900 hover:text-primary transition-colors"
                          >
                            {order.Title}
                          </Link>
                          <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                            <Clock className="w-3.5 h-3.5" />
                            {order.SRD || "—"}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-gray-900 text-sm">
                          {order.CloudProvider}
                        </div>
                        <div className="mt-1">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${getStatusColor(order.Status)}`}
                          >
                            {order.Status}
                          </span>
                        </div>
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

export default CustomerProfile;
