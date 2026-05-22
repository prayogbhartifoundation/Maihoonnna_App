import React from 'react';
import { Calendar, Clock, CheckCircle2, X } from 'lucide-react';

interface DeactivationSummaryModalProps {
  data: {
    name: string;
    startDate: string;
    endDate: string;
    workingDays: number;
  };
  onClose: () => void;
}

const DeactivationSummaryModal: React.FC<DeactivationSummaryModalProps> = ({ data, onClose }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center">
            <CheckCircle2 size={40} className="text-green-500" />
          </div>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight mb-2">Staff Deactivated</h2>
          <p className="text-gray-500 font-medium">
            Profile for <span className="text-gray-800 font-bold">{data.name}</span> has been marked inactive.
          </p>
        </div>

        <div className="space-y-4 bg-[#F4EAE3]/30 p-6 rounded-2xl border border-[#E7DED6] mb-8">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <Calendar size={18} className="text-[#FF7A00]" />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Service Period</p>
              <p className="text-sm font-bold text-gray-700">
                {formatDate(data.startDate)} — {formatDate(data.endDate)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <Clock size={18} className="text-[#FF7A00]" />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Working Days</p>
              <p className="text-sm font-bold text-gray-700">{data.workingDays} Days</p>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-[#FF7A00] text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200"
        >
          Close Summary
        </button>
      </div>
    </div>
  );
};

export default DeactivationSummaryModal;
