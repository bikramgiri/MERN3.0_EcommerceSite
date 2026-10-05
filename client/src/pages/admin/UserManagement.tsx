import React, { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Search,
  RefreshCw,
  Eye,
  Trash2,
  Mail,
  ShieldCheck,
  CheckCircle2,
  Clock,
  X,
  AlertTriangle,
  Copy,
  Check,
} from "lucide-react";
import { APIAuthenticated } from "../../http";
import { toast } from "react-toastify";
import { useAppDispatch, useAppSelector } from "../../hooks/hooks";
import { fetchDatas } from "../../store/admin/datasSlice";

export interface ManagedUser {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  role?: "customer" | "admin";
  isVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
  orderCount?: number;
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "Recently";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
  });
}

function initials(name?: string) {
  return name?.trim()?.[0]?.toUpperCase() || "U";
}

const UserManagement: React.FC = () => {
  const dispatch = useAppDispatch();
  const { recentUsers, recentOrders } = useAppSelector(
    (state) => state.datas
  );
  const { user: currentAdmin } = useAppSelector((state) => state.auth);

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const q = searchParams.get("search");
    if (q) {
      const lower = q.trim().toLowerCase();
      if (lower === "customer" || lower === "customers") {
        setRoleFilter("customer");
      } else if (lower === "admin" || lower === "admins") {
        setRoleFilter("admin");
      } else {
        setSearchTerm(q);
      }
      setCurrentPage(1);
    }

    const roleParam = searchParams.get("role");
    if (roleParam && (roleParam === "customer" || roleParam === "admin" || roleParam === "ALL")) {
      setRoleFilter(roleParam);
      setCurrentPage(1);
    }
  }, [searchParams]);
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name_asc" | "name_desc">("newest");
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
  const [userToDelete, setUserToDelete] = useState<ManagedUser | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchDeleteModal, setBatchDeleteModal] = useState(false);
  const [batchDeleting, setBatchDeleting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Fetch users from API
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await APIAuthenticated.get("/admin/customer?limit=100");
      if (response.status === 200 && response.data.data) {
        let fetchedUsers: ManagedUser[] = response.data.data;

        // Fallback: include current admin if not returned by backend
        if (currentAdmin?.id && !fetchedUsers.some((u) => u.id === currentAdmin.id)) {
          fetchedUsers = [
            {
              id: currentAdmin.id,
              username: currentAdmin.username || "Admin",
              email: currentAdmin.email || "",
              avatar: currentAdmin.avatar,
              role: "admin",
              isVerified: true,
              createdAt: currentAdmin.createdAt || new Date().toISOString(),
              orderCount: 0,
            },
            ...fetchedUsers,
          ];
        }

        setUsers(fetchedUsers);
      } else {
        fallbackToDatas();
      }
    } catch (error) {
      console.log("Using dashboard users as fallback:", error);
      fallbackToDatas();
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  const fallbackToDatas = () => {
    let combined: ManagedUser[] = [...recentUsers].map((u) => ({
      ...u,
      role: (u as any).role || "customer",
      isVerified: (u as any).isVerified ?? true,
    }));

    if (currentAdmin?.id && !combined.some((u) => u.id === currentAdmin.id)) {
      combined = [
        {
          id: currentAdmin.id,
          username: currentAdmin.username || "Admin",
          email: currentAdmin.email || "",
          avatar: currentAdmin.avatar,
          role: "admin",
          isVerified: true,
          createdAt: new Date().toISOString(),
        },
        ...combined,
      ];
    }
    setUsers(combined);
  };

  useEffect(() => {
    fetchUsers();
    dispatch(fetchDatas());
  }, [dispatch]);

  const handleRefresh = async () => {
    await fetchUsers();
    await dispatch(fetchDatas());
  };

  // Delete customer handler
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setDeleting(true);
    try {
      const response = await APIAuthenticated.delete(`/admin/customer/${userToDelete.id}`);
      if (response.status === 200) {
        toast.success(`User ${userToDelete.username} deleted successfully.`);
        setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
        setUserToDelete(null);
      }
    } catch (error: any) {
      console.error("Delete user error:", error);
      toast.error(error.response?.data?.message || "Failed to delete user.");
    } finally {
      setDeleting(false);
    }
  };

  const handleCopy = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter and sort users
  const filteredUsers = useMemo(() => {
    return users
      .filter((user) => {
        // Role filter
        if (roleFilter !== "ALL" && user.role !== roleFilter) {
          return false;
        }

        // Search term
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchName = user.username?.toLowerCase().includes(q);
          const matchEmail = user.email?.toLowerCase().includes(q);
          const matchId = user.id?.toLowerCase().includes(q);
          if (!matchName && !matchEmail && !matchId) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "newest") {
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        }
        if (sortBy === "oldest") {
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        }
        if (sortBy === "name_asc") {
          return (a.username || "").localeCompare(b.username || "");
        }
        if (sortBy === "name_desc") {
          return (b.username || "").localeCompare(a.username || "");
        }
        return 0;
      });
  }, [users, roleFilter, searchTerm, sortBy]);

  // Non-admin selectable users
  const selectableUsers = useMemo(
    () => filteredUsers.filter((u) => u.role !== "admin"),
    [filteredUsers]
  );

  const isAllSelected =
    selectableUsers.length > 0 &&
    selectableUsers.every((u) => selectedIds.includes(u.id));

  // Select all or toggle row (excluding admins)
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(selectableUsers.map((u) => u.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Batch delete customers handler
  const handleBatchDelete = async () => {
    const customerIdsToDelete = selectedIds.filter((id) => {
      const u = users.find((user) => user.id === id);
      return u && u.role !== "admin";
    });

    if (customerIdsToDelete.length === 0) {
      toast.warning("No deletable customer accounts selected.");
      setBatchDeleteModal(false);
      return;
    }

    setBatchDeleting(true);
    try {
      const results = await Promise.allSettled(
        customerIdsToDelete.map((id) =>
          APIAuthenticated.delete(`/admin/customer/${id}`)
        )
      );

      const successfulIds = customerIdsToDelete.filter(
        (_, idx) => results[idx].status === "fulfilled"
      );

      if (successfulIds.length > 0) {
        setUsers((prev) => prev.filter((u) => !successfulIds.includes(u.id)));
        setSelectedIds((prev) =>
          prev.filter((id) => !successfulIds.includes(id))
        );
        toast.success(
          `Successfully deleted ${successfulIds.length} customer account${
            successfulIds.length > 1 ? "s" : ""
          }.`
        );
      }

      const failedCount = customerIdsToDelete.length - successfulIds.length;
      if (failedCount > 0) {
        toast.error(`Failed to delete ${failedCount} customer(s).`);
      }

      setBatchDeleteModal(false);
      dispatch(fetchDatas());
    } catch (err) {
      console.error("Batch delete error:", err);
      toast.error("Failed to delete selected customers.");
    } finally {
      setBatchDeleting(false);
    }
  };

  // Pagination calculation
  const totalPages = Math.ceil(filteredUsers.length / pageSize) || 1;
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Stats calculation
  const customerCount = users.filter((u) => u.role !== "admin").length;
  const adminCount = users.filter((u) => u.role === "admin").length;

  return (
    <div className="space-y-6">
      {/* 1. Header Bar matching HamroTask design */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1A1613] sm:text-3xl">
            User Management
          </h1>
          <p className="mt-1 text-xs text-[#1A1613]/60 sm:text-sm">
            Manage customers, verified accounts, and admin permissions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-[#1A1613]/15 bg-[#FFFDF8] px-4 py-2 text-xs font-semibold text-[#1A1613] shadow-xs hover:bg-[#F4EEDF] transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#E6540B]" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. Unified User Management Block: Search + Filters + Batch Actions + Table (Matching HamroTask) */}
      <div className="rounded-xl border border-[#1A1613]/10 bg-[#FFFDF8] shadow-xs overflow-hidden">
        {/* Search & Filter Top Bar */}
        <div className="p-4 sm:p-5 border-b border-[#1A1613]/10">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            {/* Search Box */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#1A1613]/40 w-4 h-4" />
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-10 pl-10 pr-9 rounded-lg border border-[#1A1613]/15 bg-[#FDF8ED] text-xs text-[#1A1613] placeholder:text-[#1A1613]/40 focus:outline-none focus:border-[#E6540B] focus:ring-1 focus:ring-[#E6540B]"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1A1613]/40 hover:text-[#1A1613]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Pills matching screenshot */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => {
                  setRoleFilter("ALL");
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  roleFilter === "ALL"
                    ? "bg-[#E6540B] text-white shadow-xs"
                    : "bg-[#F4EEDF] text-[#1A1613]/70 hover:bg-[#EDE5D0]"
                }`}
              >
                <span>All</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${roleFilter === "ALL" ? "bg-white/25 text-white" : "bg-[#1A1613]/10"}`}>
                  {initialLoading ? (
                    <span className="inline-block w-2.5 h-2 rounded bg-current opacity-30 animate-pulse" />
                  ) : (
                    users.length
                  )}
                </span>
              </button>

              <button
                onClick={() => {
                  setRoleFilter("customer");
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  roleFilter === "customer"
                    ? "bg-[#E6540B] text-white shadow-xs"
                    : "bg-[#F4EEDF] text-[#1A1613]/70 hover:bg-[#EDE5D0]"
                }`}
              >
                <span>Customer</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${roleFilter === "customer" ? "bg-white/25 text-white" : "bg-[#1A1613]/10"}`}>
                  {initialLoading ? (
                    <span className="inline-block w-2.5 h-2 rounded bg-current opacity-30 animate-pulse" />
                  ) : (
                    customerCount
                  )}
                </span>
              </button>

              <button
                onClick={() => {
                  setRoleFilter("admin");
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  roleFilter === "admin"
                    ? "bg-[#E6540B] text-white shadow-xs"
                    : "bg-[#F4EEDF] text-[#1A1613]/70 hover:bg-[#EDE5D0]"
                }`}
              >
                <span>Admin</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${roleFilter === "admin" ? "bg-white/25 text-white" : "bg-[#1A1613]/10"}`}>
                  {initialLoading ? (
                    <span className="inline-block w-2.5 h-2 rounded bg-current opacity-30 animate-pulse" />
                  ) : (
                    adminCount
                  )}
                </span>
              </button>

              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="h-8 rounded-lg border border-[#1A1613]/15 bg-[#FDF8ED] px-2.5 text-xs font-medium text-[#1A1613] focus:outline-none focus:border-[#E6540B]"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="name_asc">Name (A-Z)</option>
                <option value="name_desc">Name (Z-A)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Batch Action Bar inside the unified block when users are selected */}
        {selectedIds.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-red-200 bg-red-50/95 px-4 py-3 text-xs shadow-inner animate-fade-in">
            <div className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white font-bold text-xs shadow-xs">
                {selectedIds.length}
              </span>
              <span className="font-semibold text-red-950">
                {selectedIds.length} customer{selectedIds.length > 1 ? "s" : ""} selected
              </span>
              <span className="text-red-300">|</span>
              <button
                onClick={() => setSelectedIds([])}
                className="font-medium text-red-700 underline hover:text-red-900 transition-colors"
              >
                Deselect all
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setBatchDeleteModal(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-red-700 active:scale-95 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Selected ({selectedIds.length})</span>
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#1A1613]">
            <thead className="bg-[#F4EEDF]/80 text-[11px] uppercase tracking-wider text-[#1A1613]/65 font-bold border-b border-[#1A1613]/10">
              <tr>
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    disabled={initialLoading || selectableUsers.length === 0}
                    onChange={handleSelectAll}
                    className="rounded border-[#1A1613]/20 accent-[#E6540B] cursor-pointer disabled:opacity-40"
                    title={selectableUsers.length === 0 ? "No selectable customers" : "Select all customers"}
                  />
                </th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Email Verified</th>
                <th className="py-3 px-4">Registered</th>
                <th className="py-3 px-4 text-right pr-6">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#1A1613]/10">
              {initialLoading ? (
                Array.from({ length: pageSize }).map((_, idx) => (
                  <tr key={`skeleton-${idx}`} className="animate-pulse">
                    {/* Checkbox */}
                    <td className="py-3.5 px-4">
                      <div className="w-4 h-4 rounded border border-[#1A1613]/10 bg-[#1A1613]/5" />
                    </td>

                    {/* Name & Avatar */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#1A1613]/10 shrink-0" />
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div
                            className="h-3.5 rounded bg-[#1A1613]/15"
                            style={{ width: `${80 + (idx % 4) * 20}px` }}
                          />
                          {idx === 0 && (
                            <div className="h-2 rounded bg-purple-200/70 w-16" />
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="py-3.5 px-4">
                      <div
                        className="h-3.5 rounded bg-[#1A1613]/10"
                        style={{ width: `${140 + (idx % 3) * 25}px` }}
                      />
                    </td>

                    {/* Role */}
                    <td className="py-3.5 px-4">
                      <div className="h-5 w-16 rounded-md bg-[#1A1613]/10" />
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <div className="h-5 w-14 rounded-full bg-emerald-100/60" />
                    </td>

                    {/* Email Verified */}
                    <td className="py-3.5 px-4">
                      <div className="h-4 w-16 rounded bg-[#1A1613]/10" />
                    </td>

                    {/* Registered */}
                    <td className="py-3.5 px-4">
                      <div className="h-3.5 w-20 rounded bg-[#1A1613]/10" />
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right pr-6">
                      <div className="flex items-center justify-end gap-2 pr-1">
                        <div className="w-6 h-6 rounded-md bg-[#1A1613]/10" />
                        <div className="w-6 h-6 rounded-md bg-[#1A1613]/10" />
                        <div className="w-6 h-6 rounded-md bg-[#1A1613]/10" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#1A1613]/50">
                    <p className="font-semibold text-sm">No users found</p>
                    <p className="text-xs mt-1">Try modifying your search or filter options.</p>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => {
                  const isSelected = selectedIds.includes(user.id);
                  const isAdmin = user.role === "admin";

                  return (
                    <tr
                      key={user.id}
                      onClick={() => setSelectedUser(user)}
                      className={`group cursor-pointer hover:bg-[#F4EEDF]/50 transition-colors ${
                        isSelected ? "bg-[#E6540B]/5" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td
                        className="py-3.5 px-4"
                        onClick={(e) => {
                          if (!isAdmin) {
                            handleToggleRow(user.id, e);
                          } else {
                            e.stopPropagation();
                          }
                        }}
                      >
                        {isAdmin ? (
                          <div title="Admin accounts cannot be deleted" className="cursor-not-allowed">
                            <ShieldCheck className="w-4 h-4 text-purple-600 opacity-60" />
                          </div>
                        ) : (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="rounded border-[#1A1613]/20 accent-[#E6540B] cursor-pointer"
                          />
                        )}
                      </td>

                      {/* Name & Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt=""
                              className="w-8 h-8 rounded-full object-cover border border-[#1A1613]/10 flex-shrink-0"
                            />
                          ) : (
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white flex-shrink-0 ${
                                isAdmin ? "bg-purple-600" : "bg-[#E6540B]"
                              }`}
                            >
                              {initials(user.username)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-xs text-[#1A1613] truncate max-w-[150px]">
                              {user.username}
                            </p>
                            {isAdmin && (
                              <span className="inline-block text-[10px] text-purple-700 font-bold">
                                Administrator
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3.5 px-4 text-[#1A1613]/75 font-medium">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate max-w-[180px]">{user.email}</span>
                          <button
                            onClick={(e) => handleCopy(user.email, e)}
                            className="text-[#1A1613]/30 hover:text-[#E6540B] p-0.5 rounded transition-colors"
                            title="Copy email"
                          >
                            {copiedId === user.email ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-[11px] font-semibold ${
                            isAdmin
                              ? "bg-purple-50 text-purple-700 border border-purple-200"
                              : "bg-blue-50 text-blue-700 border border-blue-200"
                          }`}
                        >
                          {isAdmin ? "Admin" : "Customer"}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                          Active
                        </span>
                      </td>

                      {/* Email Verified */}
                      <td className="py-3.5 px-4">
                        {user.isVerified !== false ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-700 font-medium text-[11px]">
                            <Clock className="w-3.5 h-3.5 text-amber-500" />
                            Pending
                          </span>
                        )}
                      </td>

                      {/* Created Date */}
                      <td className="py-3.5 px-4 text-[#1A1613]/60 font-medium">
                        {formatDate(user.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right pr-6">
                        <div
                          className="flex items-center justify-end gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* View details */}
                          <button
                            onClick={() => setSelectedUser(user)}
                            className="p-1.5 rounded-md hover:bg-[#F4EEDF] text-[#1A1613]/60 hover:text-[#1A1613] transition-colors"
                            title="View user details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Mail user */}
                          <a
                            href={`mailto:${user.email}`}
                            className="p-1.5 rounded-md hover:bg-[#F4EEDF] text-[#1A1613]/60 hover:text-[#E6540B] transition-colors"
                            title="Send email"
                          >
                            <Mail className="w-4 h-4" />
                          </a>

                          {/* Delete user (non-admin only) */}
                          {!isAdmin && (
                            <button
                              onClick={() => setUserToDelete(user)}
                              className="p-1.5 rounded-md hover:bg-red-50 text-red-500 hover:text-red-700 transition-colors"
                              title="Delete customer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between p-4 border-t border-[#1A1613]/10 text-xs text-[#1A1613]/60 bg-[#FDF8ED]/30">
          <div>
            {initialLoading ? (
              <div className="h-3.5 w-24 rounded bg-[#1A1613]/10 animate-pulse" />
            ) : (
              `Page ${currentPage} of ${totalPages}`
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={initialLoading || currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-3.5 py-1.5 rounded-lg border border-[#1A1613]/15 text-xs font-semibold text-[#1A1613] hover:bg-[#F4EEDF] disabled:opacity-40 transition-colors"
            >
              Previous
            </button>
            <button
              disabled={initialLoading || currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-3.5 py-1.5 rounded-lg border border-[#1A1613]/15 text-xs font-semibold text-[#1A1613] hover:bg-[#F4EEDF] disabled:opacity-40 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* 5. User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-md rounded-2xl border border-[#1A1613]/10 bg-[#FFFDF8] p-6 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#1A1613]/10">
              <h3 className="text-base font-bold text-[#1A1613]">User Profile</h3>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-1 rounded-full hover:bg-[#F4EEDF] text-[#1A1613]/60 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Info */}
            <div className="mt-5 flex flex-col items-center text-center">
              {selectedUser.avatar ? (
                <img
                  src={selectedUser.avatar}
                  alt=""
                  className="w-16 h-16 rounded-full object-cover border-2 border-[#E6540B]/20 shadow-xs"
                />
              ) : (
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-2xl text-white shadow-xs ${
                    selectedUser.role === "admin" ? "bg-purple-600" : "bg-[#E6540B]"
                  }`}
                >
                  {initials(selectedUser.username)}
                </div>
              )}

              <h4 className="mt-3 text-lg font-bold text-[#1A1613]">
                {selectedUser.username}
              </h4>
              <p className="text-xs text-[#1A1613]/60">{selectedUser.email}</p>

              <div className="mt-3 flex items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    selectedUser.role === "admin"
                      ? "bg-purple-50 text-purple-700 border border-purple-200"
                      : "bg-blue-50 text-blue-700 border border-blue-200"
                  }`}
                >
                  {selectedUser.role === "admin" ? "Administrator" : "Customer"}
                </span>

                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Verified
                </span>
              </div>
            </div>

            {/* Detailed Metadata */}
            <div className="mt-6 space-y-2.5 bg-[#FDF8ED] p-4 rounded-xl border border-[#1A1613]/10 text-xs">
              <div className="flex justify-between">
                <span className="text-[#1A1613]/60">User ID:</span>
                <span className="font-mono font-medium text-[#1A1613] truncate max-w-[180px]">
                  #{selectedUser.id}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#1A1613]/60">Registered on:</span>
                <span className="font-medium text-[#1A1613]">
                  {formatDate(selectedUser.createdAt)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#1A1613]/60">Total Orders:</span>
                <span className="font-bold text-[#E6540B] inline-flex items-center gap-1">
                  <span>
                    {selectedUser.orderCount !== undefined
                      ? selectedUser.orderCount
                      : recentOrders.filter(
                          (o) =>
                            o.userId === selectedUser.id ||
                            o.User?.email === selectedUser.email
                        ).length}
                  </span>
                  <span className="font-normal text-[#1A1613]/60">
                    {(selectedUser.orderCount ??
                      recentOrders.filter(
                        (o) =>
                          o.userId === selectedUser.id ||
                          o.User?.email === selectedUser.email
                      ).length) === 1
                      ? "order"
                      : "orders"}
                  </span>
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex justify-end gap-2 pt-3 border-t border-[#1A1613]/10">
              <a
                href={`mailto:${selectedUser.email}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#E6540B] text-white text-xs font-semibold hover:bg-[#d44c0a] transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Send Email</span>
              </a>
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 rounded-lg bg-[#F4EEDF] text-xs font-semibold text-[#1A1613] hover:bg-[#EDE5D0] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-sm rounded-2xl border border-[#1A1613]/10 bg-[#FFFDF8] p-6 shadow-2xl text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="mt-3 text-base font-bold text-[#1A1613]">
              Delete Customer?
            </h3>
            <p className="mt-2 text-xs text-[#1A1613]/65 leading-relaxed">
              Are you sure you want to delete{" "}
              <span className="font-bold text-[#1A1613]">{userToDelete.username}</span>?
              This will remove their profile and Cloudinary avatar permanently.
            </p>

            <div className="mt-5 flex items-center justify-center gap-2.5">
              <button
                onClick={() => setUserToDelete(null)}
                disabled={deleting}
                className="px-4 py-2 rounded-lg bg-[#F4EEDF] text-xs font-semibold text-[#1A1613] hover:bg-[#EDE5D0] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={deleting}
                className="px-4 py-2 rounded-lg bg-red-600 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50 transition-colors shadow-xs"
              >
                {deleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Batch Delete Confirmation Modal */}
      {batchDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-md rounded-2xl border border-[#1A1613]/10 bg-[#FFFDF8] p-6 shadow-2xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="mt-3 text-center">
              <h3 className="text-base font-bold text-[#1A1613]">
                Delete {selectedIds.length} Selected Customer{selectedIds.length > 1 ? "s" : ""}?
              </h3>
              <p className="mt-2 text-xs text-[#1A1613]/65 leading-relaxed">
                Are you sure you want to permanently delete these{" "}
                <span className="font-bold text-[#1A1613]">{selectedIds.length}</span> customer accounts? This action cannot be undone.
              </p>
            </div>

            {/* List preview of users to be deleted */}
            <div className="mt-4 max-h-44 overflow-y-auto rounded-xl border border-[#1A1613]/10 bg-[#FDF8ED] p-3 space-y-2">
              {users
                .filter((u) => selectedIds.includes(u.id))
                .map((u) => (
                  <div key={u.id} className="flex items-center justify-between text-xs py-0.5">
                    <div className="flex items-center gap-2 truncate pr-2">
                      <div className="w-6 h-6 rounded-full bg-[#E6540B] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                        {initials(u.username)}
                      </div>
                      <span className="font-semibold text-[#1A1613] truncate">{u.username}</span>
                      <span className="text-[#1A1613]/50 truncate text-[11px]">({u.email})</span>
                    </div>
                    <span className="text-[10px] font-semibold text-red-600 shrink-0">Delete</span>
                  </div>
                ))}
            </div>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setBatchDeleteModal(false)}
                disabled={batchDeleting}
                className="px-4 py-2 rounded-lg bg-[#F4EEDF] text-xs font-semibold text-[#1A1613] hover:bg-[#EDE5D0] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBatchDelete}
                disabled={batchDeleting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50 transition-colors shadow-xs"
              >
                {batchDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Yes, Delete All</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
