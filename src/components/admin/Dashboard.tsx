import React, { useEffect, useState, useMemo } from 'react';
import { db } from '../../services/db';
import { Users, ClipboardList, AlertTriangle, TrendingUp, Loader } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [consultations, setConsultations] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      await db.init();
      setUsers(db.getUsers());
      setConsultations(db.getConsultations());
      setLoading(false);
    };
    loadData();
  }, []);

  const emergencies = consultations.filter(c => c.emergencyFlag).length;

  const chartData = useMemo(() => {
    const counts: Record<string, number> = {};
    consultations.forEach(c => {
      if (c.diagnosis) {
        counts[c.diagnosis] = (counts[c.diagnosis] || 0) + 1;
      }
    });

    return {
      labels: Object.keys(counts),
      datasets: [
        {
          label: 'Number of Diagnoses',
          data: Object.values(counts),
          backgroundColor: 'rgba(99, 102, 241, 0.5)',
          borderColor: 'rgb(99, 102, 241)',
          borderWidth: 1,
          borderRadius: 8,
        },
      ],
    };
  }, [consultations]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <Users className="text-indigo-600" size={24} />
          </div>
          <div className="text-3xl font-bold text-slate-800">{users.length}</div>
          <div className="text-sm text-slate-500">Total Users</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <ClipboardList className="text-emerald-600" size={24} />
          </div>
          <div className="text-3xl font-bold text-slate-800">{consultations.length}</div>
          <div className="text-sm text-slate-500">Total Consultations</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="text-amber-600" size={24} />
          </div>
          <div className="text-3xl font-bold text-slate-800">
            {consultations.filter(c => c.status === 'completed').length}
          </div>
          <div className="text-sm text-slate-500">Completed</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <AlertTriangle className="text-red-600" size={24} />
          </div>
          <div className="text-3xl font-bold text-slate-800">{emergencies}</div>
          <div className="text-sm text-slate-500">Emergencies</div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Diagnosis Distribution</h3>
        <Bar 
          data={chartData} 
          options={{ 
            responsive: true, 
            plugins: { legend: { position: 'top' as const } },
            scales: { y: { beginAtZero: true } }
          }} 
        />
      </div>
    </div>
  );
};