import { AdminRepositoryPort } from '../../../../domain/port/AdminRepositoryPort';
import { ProductionStore } from '../../../../../../shared/infrastructure/store/ProductionStore';

export class JsonAdminRepositoryAdapter implements AdminRepositoryPort {
  public async getCounts(): Promise<{ students: number; professors: number; courses: number; promotions: number }> {
    const store = ProductionStore.getInstance();
    return {
      students: store.getTable('students').length,
      professors: store.getTable('professors').length,
      courses: store.getTable('courses').length,
      promotions: store.getTable('promotions').length,
    };
  }

  public async getUsers(): Promise<{ students: any[]; professors: any[]; promotions: any[] }> {
    const store = ProductionStore.getInstance();
    return {
      students: store.getTable('students'),
      professors: store.getTable('professors'),
      promotions: store.getTable('promotions'),
    };
  }

  public async saveStudent(student: any): Promise<void> {
    const store = ProductionStore.getInstance();
    const students = store.getTable('students');
    const index = students.findIndex(s => s.id === student.id);
    if (index !== -1) {
      students[index] = { ...students[index], ...student };
    } else {
      students.unshift(student);
    }
    store.saveTable('students', students);
  }

  public async deleteStudent(id: string): Promise<boolean> {
    const store = ProductionStore.getInstance();
    const students = store.getTable('students');
    const index = students.findIndex(s => s.id === id);
    if (index === -1) return false;
    students.splice(index, 1);
    store.saveTable('students', students);
    return true;
  }

  public async findStudentById(id: string): Promise<any | null> {
    const store = ProductionStore.getInstance();
    return store.findOne('students', s => s.id === id);
  }

  public async saveProfessor(prof: any): Promise<void> {
    const store = ProductionStore.getInstance();
    const professors = store.getTable('professors');
    const index = professors.findIndex(p => p.id === prof.id);
    if (index !== -1) {
      professors[index] = { ...professors[index], ...prof };
    } else {
      professors.unshift(prof);
    }
    store.saveTable('professors', professors);
  }

  public async deleteProfessor(id: string): Promise<boolean> {
    const store = ProductionStore.getInstance();
    const professors = store.getTable('professors');
    const index = professors.findIndex(p => p.id === id);
    if (index === -1) return false;
    professors.splice(index, 1);
    store.saveTable('professors', professors);
    return true;
  }

  public async getSessions(): Promise<any[]> {
    const store = ProductionStore.getInstance();
    return store.getTable('sessions');
  }

  public async findSessionById(id: string): Promise<any | null> {
    const store = ProductionStore.getInstance();
    return store.findOne('sessions', s => s.id === id);
  }

  public async saveSession(session: any): Promise<void> {
    const store = ProductionStore.getInstance();
    const sessions = store.getTable('sessions');
    const index = sessions.findIndex(s => s.id === session.id);
    if (index !== -1) {
      sessions[index] = { ...sessions[index], ...session };
    } else {
      sessions.unshift(session);
    }
    store.saveTable('sessions', sessions);
  }

  public async savePromotion(promo: any): Promise<void> {
    const store = ProductionStore.getInstance();
    const promotions = store.getTable('promotions');
    const index = promotions.findIndex(p => p.id === promo.id);
    if (index !== -1) {
      promotions[index] = { ...promotions[index], ...promo };
    } else {
      promotions.unshift(promo);
    }
    store.saveTable('promotions', promotions);
  }

  public async saveCourse(course: any): Promise<void> {
    const store = ProductionStore.getInstance();
    const courses = store.getTable('courses');
    const index = courses.findIndex(c => c.id === course.id);
    if (index !== -1) {
      courses[index] = { ...courses[index], ...course };
    } else {
      courses.unshift(course);
    }
    store.saveTable('courses', courses);
  }

  public async getPersonnel(): Promise<{ professors: any[]; staff: any[] }> {
    const store = ProductionStore.getInstance();
    return {
      professors: store.getTable('professors'),
      staff: store.getTable('staff'),
    };
  }

  public async saveStaff(staff: any): Promise<void> {
    const store = ProductionStore.getInstance();
    const staffs = store.getTable('staff');
    const index = staffs.findIndex(s => s.id === staff.id);
    if (index !== -1) {
      staffs[index] = { ...staffs[index], ...staff };
    } else {
      staffs.unshift(staff);
    }
    store.saveTable('staff', staffs);
  }

  public async deleteStaff(id: string): Promise<boolean> {
    const store = ProductionStore.getInstance();
    const staffs = store.getTable('staff');
    const index = staffs.findIndex(s => s.id === id);
    if (index === -1) return false;
    staffs.splice(index, 1);
    store.saveTable('staff', staffs);
    return true;
  }
}
