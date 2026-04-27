import React, { useEffect, useState } from 'react';
import { db } from '../../services/db';
import { Disease } from '../../types';
import { Plus, Search, BrainCircuit, X, Loader } from 'lucide-react';

export const DiseaseLibrary: React.FC = () => {
  const [diseases, setDiseases] = useState<Disease[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [aiText, setAiText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      await db.init();
      setDiseases(db.getDiseases());
      setLoading(false);
    };
    loadData();
  }, []);

  const filteredDiseases = diseases.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAiProcess = () => {
    // Simulated NLP Extraction
    const lines = aiText.split('\n');
    const name = lines[0] || 'New Disease';
    const description = lines.find(l => l.length > 50) || 'No description provided.';
    
    const newDisease: Omit<Disease, 'id'> = {
      name,
      category: 'General',
      severity: 'moderate',
      description,
      typicalDuration: 'Varies',
      symptoms: [{ name: 'Fever', frequency: 'common' }],
      diagnosticQuestions: ['How long have you felt this way?'],
      isActive: true,
      treatmentProtocols: {
        acute_1_3_days: {
          medications: [],
          home_care: ['Rest'],
          foods_to_eat: [],
          foods_to_avoid: [],
          warning_signs: [],
          follow_up: 'Consult a doctor'
        },
        subacute_4_7_days: {
          medications: [],
          home_care: ['Rest'],
          foods_to_eat: [],
          foods_to_avoid: [],
          warning_signs: [],
          follow_up: 'Consult a doctor'
        },
        chronic_8_plus_days: {
          medications: [],
          home_care: ['Rest'],
          foods_to_eat: [],
          foods_to_avoid: [],
          warning_signs: [],
          follow_up: 'Consult a doctor'
        }
      }
    };

    db.addDisease(newDisease);
    setDiseases(db.getDiseases());
    setIsAdding(false);
    setAiText('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search diseases..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors"
        >
          <Plus size={18} />
          Add Disease
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">Name</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">Category</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">Severity</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredDiseases.map(d => (
              <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-800">{d.name}</td>
                <td className="px-6 py-4 text-slate-600">{d.category}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${
                    d.severity === 'mild' ? 'bg-green-100 text-green-700' :
                    d.severity === 'moderate' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {d.severity}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-500 text-sm">
                  {d.isActive ? 'Active' : 'Inactive'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-indigo-50">
              <div className="flex items-center gap-2">
                <BrainCircuit className="text-indigo-600" />
                <h3 className="text-xl font-bold text-slate-800">AI Disease Processor</h3>
              </div>
              <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-slate-500">Paste a natural language description of a disease. Our AI will extract symptoms, treatments, and severity automatically.</p>
              <textarea 
                className="w-full h-64 p-4 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 resize-none bg-slate-50"
                placeholder="Example: Influenza is a viral infection... Symptoms include fever, chills... Treatment involves rest and hydration..."
                value={aiText}
                onChange={(e) => setAiText(e.target.value)}
              />
              <div className="flex gap-4">
                <button 
                  onClick={handleAiProcess}
                  disabled={!aiText.trim()}
                  className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all"
                >
                  Process & Add Disease
                </button>
                <button 
                  onClick={() => setIsAdding(false)}
                  className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};