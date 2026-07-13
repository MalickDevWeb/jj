import { EleveRepositoryPort } from '../../../../domain/port/EleveRepositoryPort';
import { Eleve } from '../../../../domain/model/Eleve';
import { ProductionStore } from '../../../../../../shared/infrastructure/store/ProductionStore';

export class JsonEleveRepositoryAdapter implements EleveRepositoryPort {
  private mapToDomain(student: any): Eleve {
    let scolariteState: 'À Jour' | 'En Retard' | 'Paiement partiel' = 'À Jour';
    if (student.statutFrais === 'Paiement en retard' || student.statut_frais === 'Paiement en retard') {
      scolariteState = 'En Retard';
    } else if (student.statutFrais === 'Paiement partiel' || student.statut_frais === 'Paiement partiel') {
      scolariteState = 'Paiement partiel';
    }

    return Eleve.create(
      student.id,
      student.name,
      student.matricule,
      student.promotion_id || student.promotionId,
      scolariteState,
      Number(student.average),
      Number(student.gpa),
      student.mood
    );
  }

  public async findById(id: string): Promise<Eleve | null> {
    const store = ProductionStore.getInstance();
    const student = store.findOne('students', s => s.id === id);
    if (!student) return null;
    return this.mapToDomain(student);
  }

  public async findByMatricule(matricule: string): Promise<Eleve | null> {
    const store = ProductionStore.getInstance();
    const student = store.findOne('students', s => s.matricule?.toLowerCase() === matricule.toLowerCase());
    if (!student) return null;
    return this.mapToDomain(student);
  }

  public async save(eleve: Eleve): Promise<void> {
    const store = ProductionStore.getInstance();
    store.update('students', eleve.id, (existing) => ({
      ...existing,
      mood: eleve.mood,
    }));
  }

  public async findPromotionName(promotionId: string): Promise<{ name: string; filiere: string; faculte: string } | null> {
    const store = ProductionStore.getInstance();
    const promo = store.findOne('promotions', p => p.id === promotionId);
    if (!promo) return null;
    return {
      name: promo.name,
      filiere: promo.filiere,
      faculte: promo.faculte
    };
  }
}
