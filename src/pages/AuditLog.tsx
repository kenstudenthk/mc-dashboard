import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  PlusCircle,
  Edit,
  Trash2,
  Clock,
  FileText,
  Mail,
} from "lucide-react";
import { Link } from "react-router-dom";
import { TutorTooltip } from "../components/TutorTooltip";
import {
  auditLogService,
  AuditLog as AuditLogEntry,
} from "../services/auditLogService";

const formatTimestamp = (iso?: string): string => {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    const day = String(d.getDate()).padStart(2, "0");
    const month = d.toLocaleString("en-GB", { month: "short" });
    const year = String(d.getFullYear()).slice(2);
    const time = d.toTimeString().slice(0, 8);
    return `${day}-${month}-${year} ${time}`;
  } catch {
    return iso;
  }
};

const AuditLog = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("All");
  const [allLogs, setAllLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    auditLogService
      .findAll()
      .then((result) => setAllLogs(Array.isArray(result) ? result : []))
      .catch(() => setError("Failed to load audit logs."))
      .finally(() => setLoading(false));
  }, []);

  const filteredLogs = allLogs.filter((log) => {
    if (actionFilter !== "All" && log.Action !== actionFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !log.UserEmail.toLowerCase().includes(query) &&
        !log.TargetID.toLowerCase().includes(query) &&
        !log.Details.toLowerCase().includes(query)
      ) {
        return false;
      }
    }
    return true;
  });

  const getActionIcon = (action: string) => {
    switch (action) {
      case "Create":
        return <PlusCircle className="w-3.5 h-3.5" />;
      case "Update":
        return <Edit className="w-3.5 h-3.5" />;
      case "Delete":
        return <Trash2 className="w-3.5 h-3.5" />;
      case "Email":
        return <Mail className="w-3.5 h-3.5" />;
      default:
        return <FileText className="w-3.5 h-3.5" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "Create":
        return "bg-green-100 text-green-700 border-green-200";
      case "Update":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "Delete":
        return "bg-red-100 text-red-700 border-red-200";
      case "Email":
        return "border text-[#0089ad]";
      default:
        return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-[28px] font-semibold text-[#1d1d1f]"
            style={{ letterSpacing: "-0.28px", lineHeight: "1.1" }}
          >
            Audit Log
          </h1>
          <p className="text-sm text-[#1d1d1f]/50 mt-1">
            Track all system activities, modifications, and user actions.
          </p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-[#1d1d1f]/06 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#f5f5f7]/60">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <TutorTooltip
              text="Search logs by user name, service number, or specific details."
              position="bottom"
              wrapperClass="relative flex-1 sm:w-80"
              componentName="AuditLog.Search"
            >
              <div className="relative flex-1 sm:w-full">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#1d1d1f]/30" />
                <input
                  type="text"
                  placeholder="Search by User, Service No, or Details..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 text-sm bg-white border border-[#1d1d1f]/08 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20 focus:border-[#0071e3] transition-all"
                />
              </div>
            </TutorTooltip>
            <TutorTooltip
              text="Filter logs to show only specific actions like creations, updates, or deletions."
              position="bottom"
              componentName="AuditLog.Filter"
            >
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-[#1d1d1f]/30" />
                <select
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  className="text-sm bg-white border border-[#1d1d1f]/08 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20 text-[#1d1d1f]/70"
                >
                  <option value="All">All Actions</option>
                  <option value="Create">Create</option>
                  <option value="Update">Update</option>
                  <option value="Delete">Delete</option>
                  <option value="Email">Email</option>
                </select>
              </div>
            </TutorTooltip>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="hidden md:table-row border-b border-[#1d1d1f]/06">
                <th className="px-6 py-3.5 label-text text-[#1d1d1f]/35 w-48">
                  Date & Time
                </th>
                <th className="px-6 py-3.5 label-text text-[#1d1d1f]/35 w-48">
                  User
                </th>
                <th className="px-6 py-3.5 label-text text-[#1d1d1f]/35 w-32">
                  Action
                </th>
                <th className="px-6 py-3.5 label-text text-[#1d1d1f]/35 w-40">
                  Service No.
                </th>
                <th className="px-6 py-3.5 label-text text-[#1d1d1f]/35">
                  Details (What changed)
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-[#1d1d1f]/30 text-sm"
                  >
                    Loading audit logs…
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-red-500 text-sm"
                  >
                    {error}
                  </td>
                </tr>
              ) : filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <React.Fragment key={log.id}>
                    {/* Mobile Card View */}
                    <tr className="md:hidden border-b border-[#1d1d1f]/04">
                      <td colSpan={5} className="px-4 py-3">
                        <div className="rounded-xl border border-[#1d1d1f]/06 p-3 bg-white flex flex-col gap-2.5">
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex items-center gap-1.5 text-xs text-[#1d1d1f]/45 whitespace-nowrap">
                              <Clock className="w-3.5 h-3.5 text-[#1d1d1f]/25" />
                              {formatTimestamp(log.Created)}
                            </div>
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${getActionColor(log.Action)}`}
                              style={
                                log.Action === "Email"
                                  ? { background: "#ddf4fd", borderColor: "#3bd3fd50" }
                                  : undefined
                              }
                            >
                              {getActionIcon(log.Action)}
                              {log.Action}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 mt-1">
                            <div className="w-6 h-6 rounded-full bg-blue-50 text-[#0071e3] flex items-center justify-center text-[10px] font-bold">
                              {log.UserEmail?.charAt(0).toUpperCase() ?? "?"}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-medium text-[#1d1d1f]">
                                {log.UserEmail ?? "—"}
                              </span>
                              {log.TargetID && (
                                <Link to={`/orders/${log.TargetID}`} className="text-[11px] font-semibold text-[#0071e3] hover:underline">
                                  {log.TargetID}
                                </Link>
                              )}
                            </div>
                          </div>
                          
                          <div className="bg-[#f5f5f7] p-2.5 rounded-lg text-xs text-[#1d1d1f]/70 mt-1 break-words">
                            {log.Details}
                          </div>
                        </div>
                      </td>
                    </tr>

                    {/* Desktop Table Row */}
                    <tr
                      className="hidden md:table-row border-b border-[#1d1d1f]/04 hover:bg-[#f5f5f7] transition-colors"
                    >
                    <td className="px-6 py-3.5 text-xs text-[#1d1d1f]/45 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#1d1d1f]/25" />
                        {formatTimestamp(log.Created)}
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-xs font-medium text-[#1d1d1f]">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-blue-50 text-[#0071e3] flex items-center justify-center text-[10px] font-bold">
                          {log.UserEmail?.charAt(0).toUpperCase() ?? "?"}
                        </div>
                        {log.UserEmail ?? "—"}
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${getActionColor(log.Action)}`}
                        style={
                          log.Action === "Email"
                            ? { background: "#ddf4fd", borderColor: "#3bd3fd50" }
                            : undefined
                        }
                      >
                        {getActionIcon(log.Action)}
                        {log.Action}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-xs font-semibold text-[#0071e3] hover:underline">
                      {log.TargetID ? (
                        <Link to={`/orders/${log.TargetID}`}>
                          {log.TargetID}
                        </Link>
                      ) : (
                        <span className="text-[#1d1d1f]/25">—</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-xs text-[#1d1d1f]/60">
                      {log.Details}
                    </td>
                  </tr>
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-[#1d1d1f]/30 text-sm"
                  >
                    No audit logs found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-[#1d1d1f]/06 flex items-center justify-between text-xs text-[#1d1d1f]/45">
          <div>Showing {filteredLogs.length} entries</div>
          <div className="flex gap-1">
            <button
              className="px-3 py-1 border border-[#1d1d1f]/08 rounded-lg hover:bg-[#f5f5f7] disabled:opacity-40 text-[#1d1d1f]/60"
              disabled
            >
              Prev
            </button>
            <button className="px-3 py-1 bg-[#0071e3] text-white rounded-lg text-xs font-medium">
              1
            </button>
            <button
              className="px-3 py-1 border border-[#1d1d1f]/08 rounded-lg hover:bg-[#f5f5f7] disabled:opacity-40 text-[#1d1d1f]/60"
              disabled
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLog;
