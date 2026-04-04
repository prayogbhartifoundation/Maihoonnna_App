import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { 
  X, User, Phone, Mail, MapPin, Package, Calendar, Loader2, Users, 
  UserCheck, ChevronRight, ArrowLeft, Edit2
} from 'lucide-react';
import { subscriberApi } from '../../services/api';
import { StatusChip } from '../components/common/StatusChip';
import { Button } from '../components/ui/button';

export default function SubscriberProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetails = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await subscriberApi.getById(id);
      setDetails(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load subscriber details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const openBeneficiary = (ben: any) => {
    navigate(`/beneficiaries/${ben.id}`);
  };

  if (loading) {
    return (
      <div className="p-8 bg-[#F4EAE3] min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-[#FF7A00]" />
          <p className="font-bold text-sm uppercase tracking-widest text-gray-500">Loading Subscriber Profile...</p>
        </div>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="p-8 bg-[#F4EAE3] min-h-screen">
        <Button variant="ghost" onClick={() => navigate('/subscribers')} className="mb-6 gap-2">
          <ArrowLeft size={16} /> Back to Subscribers
        </Button>
        <div className="bg-white rounded-[32px] p-20 border border-dashed border-[#E7DED6] text-center">
          <X className="w-16 h-16 text-red-100 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800">{error || 'Subscriber not found'}</h2>
          <Button onClick={() => navigate('/subscribers')} className="mt-6 bg-[#FF7A00]">Return to List</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-[#F4EAE3] min-h-screen">
      <div className="max-w-5xl mx-auto">
        <button 
          onClick={() => navigate('/subscribers')}
          className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-800 transition-colors mb-6"
        >
          <ArrowLeft size={16} /> Back to Subscribers
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Profile Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-[32px] p-8 shadow-sm border border-[#E7DED6]">
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full bg-orange-100 flex items-center justify-center mb-4 border-4 border-white shadow-sm">
                  <User className="w-12 h-12 text-[#FF7A00]" />
                </div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">{details.name}</h1>
                <div className="mt-2">
                  <StatusChip status={details.isActive ? 'Active' : 'Inactive'} />
                </div>
                <p className="text-xs font-bold text-gray-400 mt-4 uppercase tracking-[0.2em]">Subscriber ID: {details.id}</p>
              </div>

              <div className="mt-8 space-y-4 pt-8 border-t border-gray-50">
                <div className="flex items-center gap-4 group">
                  <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center text-[#FF7A00] flex-shrink-0">
                    <Phone size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black text-gray-400 uppercase">Phone</p>
                    <p className="text-sm font-bold text-gray-700">{details.phone || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 group">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 flex-shrink-0">
                    <Mail size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black text-gray-400 uppercase">Email</p>
                    <p className="text-sm font-bold text-gray-700 truncate">{details.email || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 group">
                  <div className="w-10 h-10 rounded-2xl bg-green-50 flex items-center justify-center text-green-600 flex-shrink-0">
                    <MapPin size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black text-gray-400 uppercase">Address</p>
                    <p className="text-sm font-bold text-gray-700">{details.address || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 group">
                  <div className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-500 flex-shrink-0">
                    <Calendar size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black text-gray-400 uppercase">Joined On</p>
                    <p className="text-sm font-bold text-gray-700">{details.createdAt ? new Date(details.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '--'}</p>
                  </div>
                </div>
              </div>

              <button className="w-full mt-8 py-3 rounded-2xl bg-[#F4EAE3] text-gray-700 font-black uppercase tracking-widest text-[10px] border border-[#E7DED6] hover:bg-[#E7DED6] transition-colors flex items-center justify-center gap-2">
                <Edit2 size={14} /> Edit Profile
              </button>
            </div>
          </div>

          {/* Right Column: Beneficiaries & Subscriptions */}
          <div className="lg:col-span-2 space-y-8">
            {/* Active Subscription Block */}
            <div className="bg-gradient-to-br from-[#FF7A00] to-[#FF9D43] rounded-[32px] p-8 text-white shadow-lg relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] opacity-80">Current Subscription</h3>
                  <Package className="w-6 h-6 opacity-40 animate-pulse" />
                </div>

                {details.subscriptions && details.subscriptions.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {details.subscriptions.map((sub: any, i: number) => (
                      <div key={i} className="bg-white/20 backdrop-blur-md rounded-2xl p-5 border border-white/20">
                        <p className="text-xl font-black">{sub.package?.name || 'Care Package'}</p>
                        <p className="text-xs font-bold uppercase tracking-widest opacity-80 mt-1">{sub.package?.type || 'Standard Plan'}</p>
                        <div className="mt-4 flex items-center gap-2 bg-white/20 w-fit px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                          <StatusChip status="Active" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/10 flex flex-col items-center">
                    <p className="text-lg font-bold opacity-70">No active plans found</p>
                    <button className="mt-4 px-6 py-2 bg-white text-[#FF7A00] rounded-xl font-black uppercase tracking-widest text-[10px]">Upgrade Now</button>
                  </div>
                )}
              </div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
            </div>

            {/* Beneficiaries List */}
            <div className="bg-white rounded-[32px] p-8 shadow-sm border border-[#E7DED6]">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-lg font-black text-gray-800">Beneficiaries</h3>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">People receiving care services</p>
                </div>
                <div className="bg-[#F4EAE3] px-4 py-2 rounded-2xl border border-[#E7DED6]">
                  <span className="text-sm font-black text-gray-700">{details.beneficiaries?.length || 0} Total</span>
                </div>
              </div>

              {details.beneficiaries && details.beneficiaries.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {details.beneficiaries.map((b: any) => (
                    <button
                      key={b.id}
                      onClick={() => openBeneficiary(b)}
                      className="group w-full bg-gray-50/50 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-6 hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-orange-100 text-left"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-[#FF7A00] group-hover:bg-orange-50 group-hover:border-orange-100 transition-colors shadow-sm">
                          <User size={24} />
                        </div>
                        <div>
                          <p className="font-black text-gray-900 group-hover:text-[#FF7A00] transition-colors">{b.name}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-400 font-bold uppercase tracking-tight">
                            <span>{b.age} Years</span>
                            <span>•</span>
                            <span>{b.gender}</span>
                            <span>•</span>
                            <span className="text-blue-500">{b.relationship || 'Primary Recipient'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {b.primaryCC?.name ? (
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-100/50 text-[#FF7A00] rounded-xl border border-orange-100 font-black text-[10px] uppercase tracking-wider">
                            <UserCheck size={14} /> CC: {b.primaryCC.name}
                          </div>
                        ) : (
                          <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest">No CC Assigned</div>
                        )}
                        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#FF7A00] transition-transform group-hover:translate-x-1" />
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-gray-50/50 rounded-[32px] border border-dashed border-gray-200">
                  <Users className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                  <p className="font-bold text-gray-400 uppercase tracking-widest text-sm">No beneficiaries registered</p>
                  <button className="mt-4 text-[#FF7A00] font-black text-[10px] uppercase tracking-widest">Add First Recipient</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Beneficiary Details Modal Removed */}
    </div>
  );
}
