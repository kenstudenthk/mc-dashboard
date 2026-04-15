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
    if (!id || isNaN(Number(id))) {
      setError("Invalid customer ID.");
      setLoading(false);
      return;
    }
    Promise.all([customerService.findById(Number(id)), orderService.findAll()])
      .then(([cust, allOrders]) => {
        setCustomer(cust);
        setFormData({ email: cust.Email, phone: cust.Phone });
        setNotesData(cust.SpecialNotes || "");
        setOrders(allOrders.filter((o) => Number(o.CustomerID) === cust.id));
      })
      .catch(() => setError("Failed to load customer details."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = () => setIsEditing(false);
  const handleSaveNotes = () => setIsEditingNotes(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-[#1d1d1f]/30 text-sm">
        Loading…
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="flex items-center justify-center py-24 text-red-500 text-sm">
        {error ?? "Customer not found."}
      </div>
    );
  }

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
    <div className="space-y-5 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/customers"
            className="p-2 bg-[#f5f5f7] border border-[#1d1d1f]/08 rounded-lg hover:bg-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-[#1d1d1f]/60" />
          </Link>
          <div>
            <h1
              className="text-[28px] font-semibold text-[#1d1d1f]"
              style={{ letterSpacing: "-0.28px", lineHeight: "1.1" }}
            >
              {customer.Title || customer.Company || `Customer #${customer.id}`}
            </h1>
            <p className="text-sm text-[#1d1d1f]/45 mt-1">
              Customer ID: #{customer.id}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="p-2 bg-[#f5f5f7] border border-[#1d1d1f]/08 rounded-lg hover:bg-white transition-colors text-[#1d1d1f]/50"
                title="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                onClick={handleSave}
                className="p-2 bg-[#0071e3] text-white rounded-lg hover:bg-[#0071e3]/90 transition-colors"
                title="Save Changes"
              >
                <Save className="w-4 h-4" />
              </button>
            </>
          ) : (
            <TutorTooltip
              text="Click here to edit the customer's contact information."
              position="bottom"
            >
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 bg-[#f5f5f7] border border-[#1d1d1f]/08 rounded-lg hover:bg-white transition-colors text-[#1d1d1f]/50"
                title="Edit Profile"
              >
                <Edit className="w-4 h-4" />
              </button>
            </TutorTooltip>
          )}
          <TutorTooltip
            text="Quickly start a new order specifically for this customer."
            position="bottom"
          >
            <Link
              to="/orders/new"
              className="gradient-cta px-5 py-2 rounded-lg font-medium text-sm shadow-sm inline-flex items-center"
            >
              New Order
            </Link>
          </TutorTooltip>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column */}
        <div className="space-y-5">
          <div className="card p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-blue-50 text-[#0071e3] flex items-center justify-center font-bold text-xl">
                {(customer.Title || customer.Company || "??")
                  .substring(0, 2)
                  .toUpperCase()}
              </div>
              <div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${customer.Status === "Active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}
                >
                  {customer.Status}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-[#1d1d1f]/30 mt-0.5" />
                <div className="w-full">
                  {isEditing ? (
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full px-3 py-1.5 text-sm bg-[#f5f5f7] border border-[#1d1d1f]/08 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20"
                    />
                  ) : (
                    <div className="text-sm font-medium text-[#1d1d1f]">
                      {formData.email || "—"}
                    </div>
                  )}
                  <div className="text-xs text-[#1d1d1f]/35 mt-0.5">
                    Email Address
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-[#1d1d1f]/30 mt-0.5" />
                <div className="w-full">
                  {isEditing ? (
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="w-full px-3 py-1.5 text-sm bg-[#f5f5f7] border border-[#1d1d1f]/08 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20"
                    />
                  ) : (
                    <div className="text-sm font-medium text-[#1d1d1f]">
                      {formData.phone || "—"}
                    </div>
                  )}
                  <div className="text-xs text-[#1d1d1f]/35 mt-0.5">
                    Phone Number
                  </div>
                </div>
              </div>
            </div>
          </div>

          {serviceBreakdown.length > 0 && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-[#1d1d1f]">
                  Service Distribution
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-[#0071e3]">
                  Total: {totalOrders}
                </span>
              </div>
              <div className="space-y-2.5">
                {serviceBreakdown.map((service, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${service.color}`}
                      ></div>
                      <span className="text-sm text-[#1d1d1f]/70">
                        {service.name}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-[#1d1d1f]">
                      {service.count}
                    </span>
                  </div>
                ))}
                {totalOrders > 0 && (
                  <div className="w-full h-1.5 rounded-full bg-[#f5f5f7] flex overflow-hidden mt-3">
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

          <div className="card p-5 grid grid-cols-2 gap-3">
            <TutorTooltip
              text="Total number of orders placed by this customer."
              position="bottom"
            >
              <div className="p-4 bg-[#f5f5f7] rounded-lg">
                <div className="flex items-center gap-1.5 text-[#1d1d1f]/45 mb-2">
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider">
                    Orders
                  </span>
                </div>
                <div className="text-2xl font-semibold text-[#1d1d1f]">
                  {totalOrders}
                </div>
              </div>
            </TutorTooltip>
            <TutorTooltip
              text="Total amount spent by this customer across all orders."
              position="bottom"
            >
              <div className="p-4 bg-[#f5f5f7] rounded-lg">
                <div className="flex items-center gap-1.5 text-[#1d1d1f]/45 mb-2">
                  <DollarSign className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider">
                    Spent
                  </span>
                </div>
                <div className="text-xl font-semibold text-[#1d1d1f]">
                  $
                  {totalSpent.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
                </div>
              </div>
            </TutorTooltip>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-5">
          <TutorTooltip
            text="Use this section to store important, customer-specific information, such as special billing instructions or SLA requirements."
            position="left"
          >
            <div className="card p-6 border-l-4 border-l-amber-400">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-amber-700">
                  <StickyNote className="w-4 h-4" />
                  <h2 className="text-[17px] font-semibold">
                    Special Notes & Instructions
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  {isEditingNotes ? (
                    <>
                      <button
                        onClick={() => setIsEditingNotes(false)}
                        className="p-1.5 text-[#1d1d1f]/35 hover:text-[#1d1d1f]/60 transition-colors"
                        title="Cancel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleSaveNotes}
                        className="px-3 py-1.5 bg-amber-500 text-white text-xs font-medium rounded-lg hover:bg-amber-600 transition-colors"
                        title="Save Notes"
                      >
                        Save Notes
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditingNotes(true)}
                      className="p-1.5 text-[#1d1d1f]/35 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                      title="Edit Notes"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-amber-50/50 rounded-lg p-4 min-h-[120px]">
                {isEditingNotes ? (
                  <textarea
                    value={notesData}
                    onChange={(e) => setNotesData(e.target.value)}
                    placeholder="Type any special instructions, paste email content, or add important notes about this customer here..."
                    className="w-full h-full min-h-[150px] px-3 py-2 text-sm bg-white border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/20 resize-y"
                  />
                ) : (
                  <div className="text-sm text-[#1d1d1f]/70">
                    {notesData ? (
                      /^</.test(notesData.trim()) ? (
                        <div
                          dangerouslySetInnerHTML={{ __html: notesData }}
                        />
                      ) : (
                        <span className="whitespace-pre-wrap">{notesData}</span>
                      )
                    ) : (
                      <span className="text-[#1d1d1f]/30 italic">
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
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-[17px] font-semibold text-[#1d1d1f]">
                  Order History
                </h2>
                <Link
                  to="/orders"
                  className="text-xs font-medium text-[#0071e3] hover:underline"
                >
                  View All
                </Link>
              </div>

              {recentOrders.length === 0 ? (
                <p className="text-sm text-[#1d1d1f]/30">
                  No orders found for this customer.
                </p>
              ) : (
                <div className="space-y-3">
                  {recentOrders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-3.5 rounded-lg border border-[#1d1d1f]/06 hover:bg-[#f5f5f7] transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#f5f5f7] flex items-center justify-center text-[#1d1d1f]/40 group-hover:bg-white group-hover:shadow-sm transition-all">
                          <ShoppingBag className="w-4 h-4" />
                        </div>
                        <div>
                          <Link
                            to={`/orders/${order.id}`}
                            className="text-sm font-medium text-[#1d1d1f] hover:text-[#0071e3] transition-colors"
                          >
                            {order.Title}
                          </Link>
                          <div className="flex items-center gap-1.5 text-xs text-[#1d1d1f]/40 mt-0.5">
                            <Clock className="w-3 h-3" />
                            {order.SRD || "—"}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-medium text-[#1d1d1f]/70">
                          {order.CloudProvider}
                        </div>
                        <div className="mt-1">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getStatusColor(order.Status)}`}
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
