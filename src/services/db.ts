import { supabase } from './supabase';
import { User, Consultation, Message, Disease } from '../types';

const INITIAL_DISEASES: Disease[] = [
  {
    id: '1',
    name: 'Common Cold',
    category: 'Respiratory',
    severity: 'mild',
    description: 'A viral infection of your nose and throat (upper respiratory tract).',
    typicalDuration: '7-10 days',
    symptoms: [
      { name: 'runny nose', frequency: 'very common' },
      { name: 'sore throat', frequency: 'common' },
      { name: 'cough', frequency: 'common' },
      { name: 'congestion', frequency: 'common' }
    ],
    diagnosticQuestions: ['Do you have a fever?', 'Is your throat sore?', 'Are you sneezing?'],
    treatmentProtocols: {
      acute_1_3_days: {
        medications: [{ name: 'Acetaminophen', dosage_adult: '500mg', dosage_pediatric: '250mg', frequency: 'Every 6 hours', purpose: 'Pain/Fever' }],
        home_care: ['Rest', 'Hydration'],
        foods_to_eat: ['Chicken soup', 'Fruit'],
        foods_to_avoid: ['Dairy', 'Sugary drinks'],
        warning_signs: ['High fever', 'Difficulty breathing'],
        follow_up: 'Continue monitoring'
      },
      subacute_4_7_days: {
        medications: [{ name: 'Vitamin C', dosage_adult: '1000mg', dosage_pediatric: '500mg', frequency: 'Daily', purpose: 'Immune support' }],
        home_care: ['Steam inhalation'],
        foods_to_eat: ['Warm liquids'],
        foods_to_avoid: [],
        warning_signs: ['Symptoms worsening after 7 days'],
        follow_up: 'Consult if no improvement'
      },
      chronic_8_plus_days: {
        medications: [],
        home_care: [],
        foods_to_eat: [],
        foods_to_avoid: [],
        warning_signs: [],
        follow_up: 'Please see a doctor'
      }
    },
    isActive: true
  },
  {
    id: '2',
    name: 'Influenza (Flu)',
    category: 'Respiratory',
    severity: 'moderate',
    description: 'A viral infection that attacks your respiratory system — your nose, throat and lungs.',
    typicalDuration: '1-2 weeks',
    symptoms: [
      { name: 'fever', frequency: 'very common' },
      { name: 'body aches', frequency: 'common' },
      { name: 'fatigue', frequency: 'common' },
      { name: 'chills', frequency: 'common' }
    ],
    diagnosticQuestions: ['Do you have body aches?', 'Is your temperature above 100.4F?', 'Do you feel extremely tired?'],
    treatmentProtocols: {
      acute_1_3_days: {
        medications: [{ name: 'Ibuprofen', dosage_adult: '400mg', dosage_pediatric: '200mg', frequency: 'Every 8 hours', purpose: 'Pain/Inflammation' }],
        home_care: ['Complete bed rest', 'Electrolytes'],
        foods_to_eat: ['Broth', 'Herbal tea'],
        foods_to_avoid: ['Alcohol', 'Caffeine'],
        warning_signs: ['Chest pain', 'Confusion'],
        follow_up: 'Monitor temperature closely'
      },
      subacute_4_7_days: {
        medications: [],
        home_care: ['Gradual return to activity'],
        foods_to_eat: [],
        foods_to_avoid: [],
        warning_signs: [],
        follow_up: 'Ensure fever has subsided for 24h'
      },
      chronic_8_plus_days: {
        medications: [],
        home_care: [],
        foods_to_eat: [],
        foods_to_avoid: [],
        warning_signs: [],
        follow_up: 'See a professional if fatigue persists'
      }
    },
    isActive: true
  }
];

class DBService {
  // In-memory cache
  private users: User[] = [];
  private consultations: Consultation[] = [];
  private messages: Message[] = [];
  private diseases: Disease[] = INITIAL_DISEASES;

  async init() {
    // Load all data from Supabase on init
    await this.loadUsers();
    await this.loadConsultations();
    await this.loadMessages();
    await this.loadDiseases();
  }

  private async loadUsers() {
    const { data, error } = await supabase.from('profiles').select('*');
    if (!error && data) {
      this.users = data.map(p => ({
        id: p.id,
        name: p.name,
        age: p.age,
        gender: p.gender,
        allergies: p.allergies || [],
        medications: p.current_medications || [],
        createdAt: p.created_at
      }));
    }
  }

  private async loadConsultations() {
    const { data, error } = await supabase.from('consultations').select('*').order('created_at', { ascending: true });
    if (!error && data) {
      this.consultations = data.map(c => ({
        id: c.id,
        userId: c.user_id,
        timestamp: c.created_at,
        chiefComplaint: c.chief_complaint || '',
        diagnosis: c.diagnosis || '',
        confidenceLevel: c.confidence_level || 'Medium',
        status: c.status || 'active',
        emergencyFlag: c.emergency_flag || false,
        symptoms: c.symptoms_snapshot || []
      }));
    }
  }

  private async loadMessages() {
    const { data, error } = await supabase.from('messages').select('*').order('timestamp', { ascending: true });
    if (!error && data) {
      this.messages = data.map(m => ({
        id: m.id,
        consultationId: m.consultation_id,
        type: m.sender_type,
        content: m.content,
        timestamp: m.timestamp
      }));
    }
  }

  private async loadDiseases() {
    const { data, error } = await supabase.from('diseases').select('*').eq('is_active', true);
    if (!error && data && data.length > 0) {
      this.diseases = data.map(d => ({
        id: d.id,
        name: d.name,
        category: d.category,
        severity: d.severity,
        description: d.description,
        typicalDuration: d.typical_duration,
        symptoms: d.symptoms_json,
        diagnosticQuestions: d.diagnostic_questions,
        treatmentProtocols: d.treatment_protocols_json,
        isActive: d.is_active
      }));
    }
  }

  getUsers() { return this.users; }
  
  getUsersByName(name: string) { 
    return this.users.filter(u => u.name.toLowerCase() === name.toLowerCase()); 
  }

  getUser(id: string) { 
    return this.users.find(u => u.id === id); 
  }

  async addUser(user: Omit<User, 'id' | 'createdAt'>) {
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        name: user.name,
        age: user.age,
        gender: user.gender,
        allergies: user.allergies,
        current_medications: user.medications
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating user:', error);
      return null;
    }

    const newUser: User = {
      id: data.id,
      name: data.name,
      age: data.age,
      gender: data.gender,
      allergies: data.allergies || [],
      medications: data.current_medications || [],
      createdAt: data.created_at
    };

    this.users.push(newUser);
    return newUser;
  }

  getConsultations() { return this.consultations; }
  
  getConsultationsByUser(userId: string) {
    return this.consultations.filter(c => c.userId === userId);
  }

  getConsultation(id: string) { 
    return this.consultations.find(c => c.id === id); 
  }

  async startConsultation(userId: string) {
    const { data, error } = await supabase
      .from('consultations')
      .insert({
        user_id: userId,
        status: 'active',
        emergency_flag: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error starting consultation:', error);
      return null;
    }

    const consultation: Consultation = {
      id: data.id,
      userId: data.user_id,
      timestamp: data.created_at,
      status: data.status,
      emergencyFlag: data.emergency_flag,
      symptoms: data.symptoms_snapshot || []
    };

    this.consultations.push(consultation);
    return consultation;
  }

  async updateConsultation(id: string, updates: Partial<Consultation>) {
    const supabaseUpdates: any = {};
    if (updates.chiefComplaint !== undefined) supabaseUpdates.chief_complaint = updates.chiefComplaint;
    if (updates.diagnosis !== undefined) supabaseUpdates.diagnosis = updates.diagnosis;
    if (updates.confidenceLevel !== undefined) supabaseUpdates.confidence_level = updates.confidenceLevel;
    if (updates.status !== undefined) supabaseUpdates.status = updates.status;
    if (updates.emergencyFlag !== undefined) supabaseUpdates.emergency_flag = updates.emergencyFlag;
    if (updates.symptoms !== undefined) supabaseUpdates.symptoms_snapshot = updates.symptoms;
    if (updates.status === 'completed') supabaseUpdates.completed_at = new Date().toISOString();

    const { error } = await supabase
      .from('consultations')
      .update(supabaseUpdates)
      .eq('id', id);

    if (error) {
      console.error('Error updating consultation:', error);
      return;
    }

    const index = this.consultations.findIndex(c => c.id === id);
    if (index !== -1) {
      this.consultations[index] = { ...this.consultations[index], ...updates };
    }
  }

  getMessages(consultationId: string) {
    return this.messages.filter(m => m.consultationId === consultationId);
  }

  async addMessage(consultationId: string, type: 'bot' | 'user', content: string) {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        consultation_id: consultationId,
        sender_type: type,
        content: content
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding message:', error);
      return null;
    }

    const message: Message = {
      id: data.id,
      consultationId: data.consultation_id,
      type: data.sender_type,
      content: data.content,
      timestamp: data.timestamp
    };

    this.messages.push(message);
    return message;
  }

  getDiseases() { return this.diseases; }

  async addDisease(disease: Omit<Disease, 'id'>) {
    const { data, error } = await supabase
      .from('diseases')
      .insert({
        name: disease.name,
        category: disease.category,
        severity: disease.severity,
        description: disease.description,
        typical_duration: disease.typicalDuration,
        symptoms_json: disease.symptoms,
        diagnostic_questions: disease.diagnosticQuestions,
        treatment_protocols_json: disease.treatmentProtocols,
        is_active: disease.isActive
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding disease:', error);
      return null;
    }

    const newDisease: Disease = {
      id: data.id,
      name: data.name,
      category: data.category,
      severity: data.severity,
      description: data.description,
      typicalDuration: data.typical_duration,
      symptoms: data.symptoms_json,
      diagnosticQuestions: data.diagnostic_questions,
      treatmentProtocols: data.treatment_protocols_json,
      isActive: data.is_active
    };

    this.diseases.push(newDisease);
    return newDisease;
  }
}

export const db = new DBService();

// Initialize database on load
db.init().catch(console.error);