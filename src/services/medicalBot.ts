
import { db } from './db';
import { SymptomAnalyzer } from './symptomAnalyzer';
import { DiagnosisEngine } from './diagnosisEngine';
import { TreatmentRecommender } from './treatmentRecommender';
import { SafetyChecker } from './safetyChecker';
import { QuestionGenerator } from './questionGenerator';
export class MedicalBot {
  private analyzer = new SymptomAnalyzer();
  private diagnosisEngine = new DiagnosisEngine();
  private treatmentRec = new TreatmentRecommender();
  private safety = new SafetyChecker();
  private questionGen = new QuestionGenerator();

  async processMessage(consultationId: string, message: string) {
    const consultation = db.getConsultation(consultationId);
    if (!consultation) throw new Error('Consultation not found');

    const user = db.getUser(consultation.userId);
    if (!user) throw new Error('User not found');

    // Add user message to log
    await db.addMessage(consultationId, 'user', message);

    // Initial greeting stage
    if (!consultation.chiefComplaint) {
      const complaint = this.analyzer.extractChiefComplaint(message);
      await db.updateConsultation(consultationId, { chiefComplaint: complaint });
      
      const question = this.questionGen.generateInitial(complaint);
      return await db.addMessage(consultationId, 'bot', question);
    }

    // Safety check
    const emergency = this.safety.checkEmergency(consultation.symptoms, message);
    if (emergency.isEmergency) {
      await db.updateConsultation(consultationId, { emergencyFlag: true, status: 'completed' });
      return await db.addMessage(consultationId, 'bot', emergency.message);
    }

    // Analyze symptoms
    const newSymptom = this.analyzer.analyzeResponse(message);
    const updatedSymptoms = [...consultation.symptoms, newSymptom];
    await db.updateConsultation(consultationId, { symptoms: updatedSymptoms });

    // Consultation logic
    if (updatedSymptoms.length < 3) {
      const question = this.questionGen.generateNext(consultation.chiefComplaint, updatedSymptoms.length);
      return await db.addMessage(consultationId, 'bot', question);
    } else {
      // Diagnose
      const diagnosisResult = this.diagnosisEngine.diagnose(updatedSymptoms);
      const duration = this.analyzer.calculateDurationDays(updatedSymptoms);
      const treatment = this.treatmentRec.generate(diagnosisResult.primary.condition, duration, user);

      let response = `Based on your symptoms, I suspect: **${diagnosisResult.primary.condition}** (${diagnosisResult.primary.confidence} confidence).\n\n`;
      response += `${diagnosisResult.primary.description}\n\n`;
      
      if (treatment) {
        response += `### Recommended Treatment Plan:\n`;
        response += `**Medications:**\n${treatment.medications.map((m: any) => `- ${m.name}: ${m.dosage} (${m.frequency}) - ${m.purpose}`).join('\n')}\n\n`;
        response += `**Home Care:**\n${treatment.home_care.map(i => `- ${i}`).join('\n')}\n\n`;
        response += `**Diet:**\nEat: ${treatment.foods_to_eat.join(', ')}\nAvoid: ${treatment.foods_to_avoid.join(', ')}\n\n`;
        response += `**Warning Signs:**\n${treatment.warning_signs.join(', ')}\n\n`;
        response += `**Follow-up:**\n${treatment.follow_up}`;
      }

      await db.updateConsultation(consultationId, { 
        diagnosis: diagnosisResult.primary.condition,
        confidenceLevel: diagnosisResult.primary.confidence,
        status: 'completed'
      });
      
      return await db.addMessage(consultationId, 'bot', response);
    }
  }
}

export const medicalBot = new MedicalBot();
