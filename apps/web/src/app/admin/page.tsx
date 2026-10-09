'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldAlert,
  Users,
  Store,
  Sliders,
  DollarSign,
  Gift,
  CheckCircle,
  XCircle,
  AlertOctagon,
  TrendingUp,
  Plus,
  Trash2
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { AgentStatus, CommissionRuleType, CategorySpecSchema } from '@tech-marketplace/shared';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatPKR } from '@/lib/utils';

export default function AdminDashboardPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'overview' | 'agents' | 'spec_editor' | 'settings'>('overview');
  const [selectedCategorySlug, setSelectedCategorySlug] = useState('mobiles');

  // Overview Query
  const { data: overviewRes } = useQuery<{ success: boolean; data: any }>({
    queryKey: ['admin-overview'],
    queryFn: () => apiFetch('/admin/overview'),
    enabled: !!user
  });

  // Agents Query
  const { data: agentsRes } = useQuery<{ success: boolean; data: any[] }>({
    queryKey: ['admin-agents'],
    queryFn: () => apiFetch('/admin/agents'),
    enabled: activeTab === 'agents'
  });

  // Categories Spec Schema Query
  const { data: specRes } = useQuery<{ success: boolean; data: CategorySpecSchema }>({
    queryKey: ['admin-specs', selectedCategorySlug],
    queryFn: () => apiFetch(`/categories/${selectedCategorySlug}/specs`)
  });

  // Agent Status Mutation
  const updateAgentMutation = useMutation({
    mutationFn: ({ agentId, status, isVerified }: { agentId: string; status: AgentStatus; isVerified?: boolean }) =>
      apiFetch(`/admin/agents/${agentId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, isVerified })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-agents'] });
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
    }
  });

  const overview = overviewRes?.data;
  const stats = overview?.stats || { totalUsers: 0, totalAgents: 0, pendingAgents: 0, totalProducts: 0, totalOrders: 0, totalGMV: 0, totalCommissions: 0 };
  const agents = agentsRes?.data || [];
  const specSchema = specRes?.data;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-900/60 text-teal-300 text-xs font-bold mb-2">
            <ShieldAlert className="w-3.5 h-3.5" /> Super Admin Gateway
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Platform Control Center</h1>
          <p className="text-xs text-slate-400 mt-1">Manage vendor approvals, catalog spec schemas, and fee structures</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Environment: <strong className="text-emerald-400">Live Stage</strong></span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-1 text-xs font-bold overflow-x-auto">
        {[
          { key: 'overview', label: 'Overview Metrics', icon: TrendingUp },
          { key: 'agents', label: 'Agent Verification Queue', icon: Store },
          { key: 'spec_editor', label: 'Dynamic Spec Schema Visual Builder', icon: Sliders },
          { key: 'settings', label: 'Commission & Reward Rates', icon: DollarSign },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2.5 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-ink'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl border border-border p-6 shadow-xs">
              <span className="text-xs font-semibold text-ink-muted uppercase">Platform GMV</span>
              <h3 className="text-2xl font-black text-teal-800 mt-1">{formatPKR(stats.totalGMV)}</h3>
            </div>
            <div className="bg-white rounded-2xl border border-border p-6 shadow-xs">
              <span className="text-xs font-semibold text-ink-muted uppercase">Platform Commission Earned</span>
              <h3 className="text-2xl font-black text-emerald-700 mt-1">{formatPKR(stats.totalCommissions)}</h3>
            </div>
            <div className="bg-white rounded-2xl border border-border p-6 shadow-xs">
              <span className="text-xs font-semibold text-ink-muted uppercase">Pending Agent Approvals</span>
              <h3 className="text-2xl font-black text-amber-600 mt-1">{stats.pendingAgents}</h3>
            </div>
            <div className="bg-white rounded-2xl border border-border p-6 shadow-xs">
              <span className="text-xs font-semibold text-ink-muted uppercase">Total Orders Handled</span>
              <h3 className="text-2xl font-black text-ink mt-1">{stats.totalOrders}</h3>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AGENT VERIFICATION QUEUE */}
      {activeTab === 'agents' && (
        <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-xs">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h3 className="font-bold text-sm text-ink">Physical Retailers & Merchant Approvals</h3>
            <span className="text-xs text-ink-muted">{agents.length} Registered Agents</span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-xs text-left">
              <thead className="bg-slate-50 font-bold text-slate-700">
                <tr>
                  <th className="p-3.5">Shop Name</th>
                  <th className="p-3.5">Location</th>
                  <th className="p-3.5">Contact</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Verified Badge</th>
                  <th className="p-3.5 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {agents.map((ag: any) => (
                  <tr key={ag.id} className="hover:bg-slate-50/50">
                    <td className="p-3.5 font-bold text-ink">{ag.shopName}</td>
                    <td className="p-3.5 text-ink-muted">{ag.address}, {ag.city}</td>
                    <td className="p-3.5 font-mono">{ag.contactPhone}</td>
                    <td className="p-3.5">
                      <Badge variant={ag.status === AgentStatus.APPROVED ? 'success' : ag.status === AgentStatus.PENDING ? 'warning' : 'danger'}>
                        {ag.status}
                      </Badge>
                    </td>
                    <td className="p-3.5">
                      {ag.isVerified ? <span className="text-emerald-700 font-bold">✓ Verified</span> : <span className="text-slate-400">Unverified</span>}
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      {ag.status !== AgentStatus.APPROVED && (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => updateAgentMutation.mutate({ agentId: ag.id, status: AgentStatus.APPROVED, isVerified: true })}
                        >
                          Approve & Verify
                        </Button>
                      )}
                      {ag.status !== AgentStatus.SUSPENDED && (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => updateAgentMutation.mutate({ agentId: ag.id, status: AgentStatus.SUSPENDED, isVerified: false })}
                        >
                          Suspend
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: DYNAMIC SPEC SCHEMA VISUAL BUILDER */}
      {activeTab === 'spec_editor' && (
        <div className="bg-white rounded-3xl border border-border p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
            <div>
              <h3 className="font-bold text-base text-ink">Dynamic Specification Engine Visual Builder</h3>
              <p className="text-xs text-ink-muted">Configure structured fields for category filters, forms & compare matrix</p>
            </div>

            <select
              value={selectedCategorySlug}
              onChange={(e) => setSelectedCategorySlug(e.target.value)}
              className="px-3.5 py-2 border border-slate-200 rounded-xl text-xs bg-white font-bold"
            >
              <option value="mobiles">Mobiles & Tablets Schema</option>
              <option value="laptops">Laptops & Computers Schema</option>
              <option value="accessories">Audio & Wearables Schema</option>
            </select>
          </div>

          {/* List of Defined Fields */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Configured Spec Fields for {specSchema?.categoryName} ({specSchema?.fields.length || 0} fields)
            </h4>

            <div className="divide-y divide-slate-100 border border-border rounded-xl overflow-hidden bg-slate-50/50">
              {specSchema?.fields.map((field, idx) => (
                <div key={field.key} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-ink">{field.label}</span>
                      <code className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                        key: {field.key}
                      </code>
                      <Badge variant="neutral" size="sm">{field.type}</Badge>
                      {field.unit && <Badge variant="brand" size="sm">Unit: {field.unit}</Badge>}
                    </div>
                    {field.options && (
                      <p className="text-[11px] text-ink-muted">
                        Options: {field.options.join(', ')}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    {field.filterable && <span className="text-emerald-700 font-semibold">• Filterable</span>}
                    {field.comparable && <span className="text-teal-700 font-semibold">• Comparable</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: COMMISSION & REWARDS */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-border p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-ink flex items-center gap-2 pb-2 border-b border-slate-100">
              <DollarSign className="w-4 h-4 text-emerald-600" /> Platform Commission Matrix
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="font-semibold text-slate-700">Mobiles & Tablets</span>
                <span className="font-bold text-teal-800">4.5%</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="font-semibold text-slate-700">Laptops & Computers</span>
                <span className="font-bold text-teal-800">4.0%</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="font-semibold text-slate-700">Audio & Wearables</span>
                <span className="font-bold text-teal-800">8.0%</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-border p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-ink flex items-center gap-2 pb-2 border-b border-slate-100">
              <Gift className="w-4 h-4 text-amber-500" /> Customer Cashback & Wallet Rules
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="font-semibold text-slate-700">Earn Rate on Delivered Orders</span>
                <span className="font-bold text-emerald-700">2.0%</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="font-semibold text-slate-700">Max Redemption Limit</span>
                <span className="font-bold text-ink">50% of Order Value</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="font-semibold text-slate-700">Signup Welcome Credit</span>
                <span className="font-bold text-amber-700">Rs. 500 PKR</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
