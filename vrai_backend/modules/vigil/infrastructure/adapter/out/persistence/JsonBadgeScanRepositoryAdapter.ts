import { BadgeScanRepositoryPort } from '../../../../domain/port/repository/BadgeScanRepositoryPort';
import { BadgeScan } from '../../../../domain/model/BadgeScan';
import { ProductionStore } from '../../../../../../shared/infrastructure/store/ProductionStore';

export class JsonBadgeScanRepositoryAdapter implements BadgeScanRepositoryPort {
  public async save(scan: BadgeScan): Promise<void> {
    const store = ProductionStore.getInstance();
    
    // Save to badge_scans table
    const scans = store.getTable('badge_scans');
    scans.unshift({
      id: scan.id,
      badgeId: scan.badgeId,
      badgeOwner: scan.badgeOwner,
      studentId: scan.studentId,
      status: scan.status,
      message: scan.message,
      assiduite: scan.assiduite,
      statutFrais: scan.statutFrais,
      zone: scan.zone,
      time: scan.time,
      date: scan.date,
      type: scan.type
    });
    store.saveTable('badge_scans', scans);

    // Save corresponding attendance record if student exists
    const students = store.getTable('students');
    const student = students.find(s => s.matricule?.toLowerCase() === scan.studentId?.toLowerCase() || s.id === scan.studentId);
    if (student) {
      const pastAtt = store.getTable('attendances').filter(a => a.student_id === student.id);
      const validAtt = pastAtt.filter(a => a.status !== 'Refusé');
      const nextType = validAtt.length % 2 === 0 ? 'arrivée' : 'départ';
      
      const newAttendance = {
        id: 'att-' + Date.now(),
        student_id: student.id,
        timestamp: new Date().toISOString(),
        type: nextType,
        method: scan.type || 'QR Code Scan',
        status: scan.status === 'Autorisé' ? "Validé d'office" : 'Refusé',
        salle: scan.zone || 'Portail Principal',
        location: 'Dakar Campus - Coordonnées GPS: 14.6937, -17.4441'
      };
      
      const attendances = store.getTable('attendances');
      attendances.unshift(newAttendance);
      store.saveTable('attendances', attendances);
    }
  }

  public async findAll(): Promise<BadgeScan[]> {
    const store = ProductionStore.getInstance();
    const rawScans = store.getTable('badge_scans');
    
    if (rawScans.length === 0) {
      // Return a default initial scan if none exists yet, to populate UI
      return [
        BadgeScan.create(
          "scan-init",
          "INIT-001",
          "Moussa Gueye",
          "221-M382",
          "Autorisé",
          "Accès autorisé - Promotion 221-GL",
          "94% d'assiduité",
          "Scolarité à jour",
          "Portail Entrée",
          new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
          "Aujourd'hui",
          "Scanner"
        )
      ];
    }

    return rawScans.map((s: any) =>
      BadgeScan.create(
        s.id,
        s.badgeId,
        s.badgeOwner,
        s.studentId,
        s.status === 'Autorisé' ? 'Autorisé' : 'Refusé',
        s.message,
        s.assiduite,
        s.statutFrais,
        s.zone,
        s.time,
        s.date,
        s.type
      )
    );
  }

  public async findRecent(): Promise<BadgeScan | null> {
    const scans = await this.findAll();
    return scans.length > 0 ? scans[0] : null;
  }

  public async findStudentByBadgeId(badgeId: string): Promise<any | null> {
    const store = ProductionStore.getInstance();
    const students = store.getTable('students');
    const matched = students.find(s => s.matricule?.toLowerCase() === badgeId.toLowerCase() || s.id === badgeId);
    return matched || null;
  }

  public async findAttendancesForStudent(studentId: string): Promise<any[]> {
    const store = ProductionStore.getInstance();
    const attendances = store.getTable('attendances');
    return attendances.filter(a => a.student_id === studentId);
  }

  public async findPromotionById(promotionId: string): Promise<any | null> {
    const store = ProductionStore.getInstance();
    const promotions = store.getTable('promotions');
    const matched = promotions.find(p => p.id === promotionId);
    return matched || null;
  }
}
