import React, { useState, useEffect } from 'react';
import {
    PhoneCall, CheckCircle2, Clock,
    Search, Filter, MoreVertical,
    User, Calendar, MessageSquare,
    ChevronRight, ArrowRight, Loader2,
    AlertCircle
} from 'lucide-react';
import { cn } from '../components/ui/utils';
import { callbacksApi } from '../../services/api';
import type { CallbackRequest } from '../../types';

const CallbacksPage = () => {
    const [callbacks, setCallbacks] = useState<CallbackRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'pending' | 'called' | 'resolved'>('all');
    const [search, setSearch] = useState('');
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const fetchCallbacks = async () => {
        try {
            setLoading(true);
            const data = await callbacksApi.getAll();
            setCallbacks(data);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch callbacks');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCallbacks();
    }, []);

    const handleUpdateStatus = async (id: string, status: string) => {
        setUpdatingId(id);
        try {
            const updated = await callbacksApi.updateStatus(id, status);
            setCallbacks(prev => prev.map(c => c.id === id ? updated : c));
        } catch (err: any) {
            alert(`Failed to update status: ${err.message}`);
        } finally {
            setUpdatingId(null);
        }
    };

    const filteredCallbacks = callbacks.filter(c => {
        const matchesFilter = filter === 'all' || c.status === filter;
        const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.phone.includes(search);
        return matchesFilter && matchesSearch;
    });

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'pending': return { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', label: 'Pending' };
            case 'called': return { icon: PhoneCall, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', label: 'Called' };
            case 'resolved': return { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100', label: 'Resolved' };
            default: return { icon: AlertCircle, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-100', label: status };
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Callback Requests</h1>
                    <p className="text-gray-500 mt-1 font-medium">Manage and track incoming assistance requests from users.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search name or phone..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm w-full md:w-64 transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {['pending', 'called', 'resolved'].map((s) => {
                    const info = getStatusInfo(s);
                    const count = callbacks.filter(c => c.status === s).length;
                    return (
                        <div key={s} className={cn("p-6 rounded-3xl border transition-all", info.bg, info.border)}>
                            <div className="flex justify-between items-start">
                                <div className={cn("p-3 rounded-2xl bg-white shadow-sm", info.color)}>
                                    <info.icon className="w-6 h-6" />
                                </div>
                                <span className="text-2xl font-black text-gray-900">{count}</span>
                            </div>
                            <h3 className="mt-4 font-black uppercase text-xs tracking-widest text-gray-500">{s} Requests</h3>
                        </div>
                    );
                })}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 p-1.5 bg-gray-100/50 rounded-2xl w-fit">
                {['all', 'pending', 'called', 'resolved'].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f as any)}
                        className={cn(
                            "px-6 py-2 rounded-xl text-sm font-black uppercase tracking-tight transition-all",
                            filter === f
                                ? "bg-white text-primary shadow-sm"
                                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100/80"
                        )}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* Table / List */}
            <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="w-10 h-10 text-primary animate-spin" />
                        <p className="text-gray-400 font-medium">Fetching requests...</p>
                    </div>
                ) : filteredCallbacks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                        <div className="p-6 bg-gray-50 rounded-full mb-4">
                            <PhoneCall className="w-10 h-10 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-black text-gray-900 uppercase">No Requests Found</h3>
                        <p className="text-gray-500 text-sm mt-1">Try adjusting your filters or search terms.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-50">
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">User Details</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Requested On</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCallbacks.map((c) => {
                                    const info = getStatusInfo(c.status);
                                    return (
                                        <tr key={c.id} className="group hover:bg-gray-50/50 transition-colors">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary font-black text-lg">
                                                        {c.name[0]}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-black text-gray-900 leading-none">{c.name}</h4>
                                                        <p className="text-sm text-gray-500 mt-1.5 font-medium flex items-center gap-1.5">
                                                            <PhoneCall className="w-3 h-3" /> {c.phone}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-2 text-gray-600 font-medium whitespace-nowrap">
                                                    <Clock className="w-4 h-4 text-gray-400" />
                                                    {new Date(c.createdAt).toLocaleDateString('en-IN', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className={cn(
                                                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-tight border",
                                                    info.color, info.bg, info.border
                                                )}>
                                                    <info.icon className="w-3 h-3" />
                                                    {info.label}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {c.status === 'pending' && (
                                                        <button
                                                            disabled={!!updatingId}
                                                            onClick={() => handleUpdateStatus(c.id, 'called')}
                                                            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-black uppercase hover:bg-blue-700 transition"
                                                        >
                                                            Mark Called
                                                        </button>
                                                    )}
                                                    {c.status === 'called' && (
                                                        <button
                                                            disabled={!!updatingId}
                                                            onClick={() => handleUpdateStatus(c.id, 'resolved')}
                                                            className="px-4 py-2 rounded-xl bg-green-600 text-white text-xs font-black uppercase hover:bg-green-700 transition"
                                                        >
                                                            Resolve
                                                        </button>
                                                    )}
                                                    <button className="p-2 rounded-xl hover:bg-gray-200 text-gray-400">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CallbacksPage;
