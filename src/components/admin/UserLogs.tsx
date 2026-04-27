import React, { useEffect, useState } from 'react';
import { db } from '../../services/db';
import { MessageSquare, Calendar, User as UserIcon, AlertCircle, Loader } from 'lucide-react';

export const UserLogs: React.FC = () => {
  const [consultations, setConsultations] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      await db.init();
      const allConsultations = [...db.getConsultations()].sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setConsultations(allConsultations);
      setLoading(false);
    };
    loadData();
  }, []);

  const selectedConsult = consultations.find(c => c.id === selectedId);
  const selectedMessages = selectedId ? db.getMessages(selectedId) : [];
  const selectedUser = selectedConsult ? db.getUser(selectedConsult.userId) : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[700px]">
      <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 bg-slate-50 border-b border-slate-100 font-bold text-slate-700">Recent Consultations</div>
        <div className="flex-1 overflow-y-auto">
          {consultations.map(c => {
            const u = db.getUser(c.userId);
            return (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={`w-full p-4 border-b border-slate-50 text-left hover:bg-slate-50 transition-colors flex flex-col gap-1 ${
                  selectedId === c.id ? 'bg-indigo-50 border-l-4 border-l-indigo-600' : ''
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className="font-bold text-slate-800">{u?.name || 'Unknown'}</span>
                  {c.emergencyFlag && <AlertCircle className="text-red-500" size={16} />}
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-1">
                  <Calendar size={12} />
                  {new Date(c.timestamp).toLocaleDateString()}
                </div>
                <div className="text-sm text-slate-500 truncate mt-1">
                  {c.diagnosis || 'Ongoing...'}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        {selectedConsult ? (
          <>
            <div className="p-6 border-b border-slate-100 bg-slate-50">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">{selectedUser?.name || 'Unknown User'}</h3>
                  <div className="flex gap-4 mt-1 text-slate-500 text-sm">
                    <span className="flex items-center gap-1"><UserIcon size={14} /> Age: {selectedUser?.age || 'N/A'}</span>
                    <span className="flex items-center gap-1"><MessageSquare size={14} /> Status: {selectedConsult.status}</span>
                  </div>
                </div>
                {selectedConsult.emergencyFlag && (
                  <div className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold animate-pulse">EMERGENCY</div>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedConsult.symptoms?.map((s: any, i: number) => (
                  <span key={i} className="bg-white border border-slate-200 px-3 py-1 rounded-lg text-xs font-medium text-slate-600">
                    {s.name} ({s.severity})
                  </span>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
              {selectedMessages.map(m => (
                <div key={m.id} className={`flex ${m.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                    m.type === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                  }`}>
                    {m.content}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-4">
            <MessageSquare size={48} className="opacity-20" />
            <p>Select a consultation to view details</p>
          </div>
        )}
      </div>
    </div>
  );
};