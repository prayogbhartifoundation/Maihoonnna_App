import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { PageHeader } from '../components/common/PageHeader';
import { DataCard } from '../components/common/DataCard'
import { StatusChip } from '../components/common/StatusChip';
import { subscriberApi } from '../../services/api';
import { MapPin, Users, Package, Phone, Mail, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import DataFilter from '../components/common/DataFilter';
import SubscriberDetailsModal from '../components/subscribers/SubscriberDetailsModal';

export default function SubscribersPage() {
  const navigate = useNavigate();
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubscriber, setSelectedSubscriber] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await subscriberApi.getAllPaginated({ search, page, limit });
      setSubscribers(resp.data || []);
      setTotal(resp.total || 0);
      setTotalPages(resp.totalPages || 1);
    } catch (e: any) {
      setError(e.message || 'Failed to load subscribers');
    } finally {
      setLoading(false);
    }
  }, [search, page, limit]);

  useEffect(() => { loadData(); }, [loadData]);

  if (error) {
    return (
      <div>
        <PageHeader title="Subscribers" description="All registered subscribers from the database" />
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <p className="text-destructive font-bold uppercase tracking-widest text-sm">{error}</p>
          <Button onClick={loadData} className="bg-[#FF7A00] hover:bg-[#e06e00]">Retry Connection</Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={`Subscribers (${total})`}
        description="All registered subscribers from the database"
      />

      <div className="mb-6">
        <DataFilter 
          onFilterChange={(state) => {
            setSearch(state.search);
            setPage(1);
          }} 
        />
      </div>

      {/* Results Area */}
      <div className="relative min-h-[400px]">
        {loading && subscribers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#FF7A00] gap-4">
            <Loader2 className="w-10 h-10 animate-spin" />
            <p className="font-bold text-sm uppercase tracking-widest">Loading Subscribers...</p>
          </div>
        ) : subscribers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-white rounded-[32px] border border-dashed border-[#E7DED6]">
            <Users className="w-16 h-16 mb-4 opacity-10" />
            <p className="font-bold uppercase tracking-widest text-sm">No Subscribers Found</p>
            <p className="text-xs">Adjust your search terms to see more results.</p>
          </div>
        ) : (
          <>
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 transition-opacity duration-300 ${loading ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
              {subscribers.map((sub) => (
                <DataCard 
                  key={sub.id} 
                  title={sub.name} 
                  description={`Subscriber`}
                  onClick={() => setSelectedSubscriber(sub.id)}
                >
                  <div className="space-y-3">

                    {sub.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-[#FF7A00] flex-shrink-0" />
                        <span className="font-medium">{sub.phone}</span>
                      </div>
                    )}

                    {sub.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-[#FF7A00] flex-shrink-0" />
                        <span className="truncate text-gray-600">{sub.email}</span>
                      </div>
                    )}

                    {sub.address && (
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-[#FF7A00] mt-0.5 flex-shrink-0" />
                        <span className="text-gray-500 italic">{sub.address}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-primary" />
                      <span className="font-bold text-xs uppercase tracking-tight">{sub.beneficiaryCount ?? sub.beneficiaries?.length ?? 0} Beneficiar{(sub.beneficiaryCount ?? 0) === 1 ? 'y' : 'ies'}</span>
                    </div>

                    {sub.activePackage && (
                      <div className="flex items-center gap-2 text-sm">
                        <Package className="w-4 h-4 text-success" />
                        <span className="font-black text-[10px] uppercase tracking-widest text-green-700 bg-green-50 px-2 py-0.5 rounded-lg">{sub.activePackage}</span>
                      </div>
                    )}

                    <div className="pt-4 border-t border-gray-100 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <StatusChip status={sub.isActive ? 'Active' : 'Inactive'} />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          Joined {sub.createdAt ? new Date(sub.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '--'}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                         <button 
                          onClick={() => navigate(`/subscribers/${sub.id}`)}
                          className="w-full py-2.5 rounded-xl bg-[#F4EAE3] text-gray-700 hover:bg-[#E7DED6] transition text-[10px] font-black uppercase tracking-widest border border-[#E7DED6]"
                         >
                           View Details
                         </button>
                      </div>
                    </div>
                  </div>
                </DataCard>
              ))}
            </div>

            {loading && subscribers.length > 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/20 backdrop-blur-[1px] z-10 rounded-[32px]">
                <div className="bg-white px-6 py-3 rounded-full shadow-lg border border-[#E7DED6] flex items-center gap-3 text-sm font-bold text-gray-700">
                  <Loader2 className="w-5 h-5 animate-spin text-[#FF7A00]" /> 
                  <span>Refreshing database...</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="mt-8 flex justify-between items-center bg-white border border-[#E7DED6] rounded-[24px] px-6 py-4 shadow-sm">
          <p className="text-sm font-semibold text-gray-500">
            Showing <span className="text-primary">{(page - 1) * limit + 1}</span> to <span className="text-primary">{Math.min(page * limit, total)}</span> of <span className="text-primary">{total}</span> subscribers
          </p>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 rounded-xl text-sm font-black uppercase tracking-widest transition bg-[#F4EAE3] text-gray-600 hover:bg-[#E7DED6] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Prev
            </button>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 rounded-xl text-sm font-black uppercase tracking-widest transition bg-[#F4EAE3] text-gray-600 hover:bg-[#E7DED6] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
            </div>
      )}

      {/* Subscriber Details Modal */}
      <SubscriberDetailsModal 
        subscriberId={selectedSubscriber} 
        onClose={() => setSelectedSubscriber(null)} 
      />

    </div>
  );
}
