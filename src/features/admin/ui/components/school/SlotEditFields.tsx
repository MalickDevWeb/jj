import React from 'react';
import { Room } from '../../../domain/SchoolModels';
import { TEACHERS, SUBJECTS } from './PlanningConstants';

interface Props {
  subject: string;
  setSubject: (v: string) => void;
  prof: string;
  setProf: (v: string) => void;
  roomName: string;
  setRoomName: (v: string) => void;
  isLive: boolean;
  rooms: Room[];
  category: 'cours' | 'devoir' | 'composition';
  setCategory: (v: 'cours' | 'devoir' | 'composition') => void;
}

export function SlotEditFields({
  subject,
  setSubject,
  prof,
  setProf,
  roomName,
  setRoomName,
  isLive,
  rooms,
  category,
  setCategory,
}: Props) {
  const getExplanation = (cat: 'cours' | 'devoir' | 'composition') => {
    switch (cat) {
      case 'cours':
        return {
          title: "📚 Cours Hebdomadaire",
          desc: "Session d'apprentissage classique récurrente. Organisée par classe avec le professeur titulaire pour dispenser le programme officiel.",
          badge: "Planification standard",
          style: "bg-blue-50/70 border-blue-200 text-blue-900"
        };
      case 'devoir':
        return {
          title: "📝 Devoir / Évaluation continue",
          desc: "Évaluation intermédiaire (quiz, test court, devoir surveillé) se déroulant pendant un créneau de cours habituel.",
          badge: "Contrôle continu",
          style: "bg-amber-50/70 border-amber-200 text-amber-900"
        };
      case 'composition':
        return {
          title: "🎓 Composition de Semestre",
          desc: "Examen officiel bloquant en fin de semestre, mobilisant généralement des surveillants externes et un anonymat strict.",
          badge: "Examen final d'école",
          style: "bg-rose-50/70 border-rose-200 text-rose-900"
        };
    }
  };

  const activeExp = getExplanation(category);

  return (
    <div className="space-y-4">
      {/* Category Selection Cards */}
      <div>
        <label className="text-[10px] uppercase font-black text-neutral-400">Type d'Activité</label>
        <div className="grid grid-cols-3 gap-2 mt-1">
          {(['cours', 'devoir', 'composition'] as const).map((cat) => {
            const isActive = category === cat;
            return (
              <button
                key={cat}
                type="button"
                disabled={isLive}
                onClick={() => setCategory(cat)}
                className={`py-2 px-1 text-center rounded-xl border text-[11px] font-black transition-all flex flex-col items-center justify-center gap-1 cursor-pointer select-none ${
                  isActive
                    ? cat === 'cours'
                      ? 'bg-blue-50 border-blue-600 text-blue-800 ring-2 ring-blue-600/10'
                      : cat === 'devoir'
                      ? 'bg-amber-50 border-amber-600 text-amber-800 ring-2 ring-amber-600/10'
                      : 'bg-rose-50 border-rose-600 text-rose-800 ring-2 ring-rose-600/10'
                    : 'bg-white border-neutral-200 hover:bg-neutral-50 text-neutral-500'
                }`}
              >
                <span className="text-base">
                  {cat === 'cours' ? '📚' : cat === 'devoir' ? '📝' : '🎓'}
                </span>
                <span className="capitalize">{cat}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Explanatory Info Card */}
      <div className={`p-3 rounded-xl border text-[11px] leading-relaxed transition-all duration-300 ${activeExp.style}`}>
        <div className="flex justify-between items-center mb-1">
          <span className="font-extrabold flex items-center gap-1">{activeExp.title}</span>
          <span className="text-[8px] font-black uppercase bg-white/80 px-1.5 py-0.5 rounded border border-current/10 shrink-0">
            {activeExp.badge}
          </span>
        </div>
        <p className="font-medium opacity-90">{activeExp.desc}</p>
      </div>

      <div>
        <label className="text-[10px] uppercase font-black text-neutral-400">Matière / Sujet</label>
        <input
          type="text"
          list="subjects-list"
          value={subject}
          disabled={isLive}
          onChange={e => setSubject(e.target.value)}
          className="w-full mt-1 px-3 py-2 border border-neutral-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#B3181C] disabled:bg-neutral-100 disabled:text-neutral-500 font-bold"
          placeholder="ex: Intelligence Artificielle"
        />
        <datalist id="subjects-list">
          {SUBJECTS.map(s => <option key={s} value={s} />)}
        </datalist>
      </div>

      <div>
        <label className="text-[10px] uppercase font-black text-neutral-400">Enseignant</label>
        <select
          value={prof}
          disabled={isLive}
          onChange={e => setProf(e.target.value)}
          className="w-full mt-1 px-3 py-2 border border-neutral-200 rounded-xl text-xs font-bold bg-white focus:outline-none focus:border-[#B3181C] disabled:bg-neutral-100 disabled:text-neutral-500"
        >
          <option value="">Sélectionner</option>
          {TEACHERS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div>
        <label className="text-[10px] uppercase font-black text-neutral-400">Salle</label>
        <select
          value={roomName}
          disabled={isLive}
          onChange={e => setRoomName(e.target.value)}
          className="w-full mt-1 px-3 py-2 border border-neutral-200 rounded-xl text-xs font-bold bg-white focus:outline-none focus:border-[#B3181C] disabled:bg-neutral-100 disabled:text-neutral-500"
        >
          <option value="">Sans salle</option>
          {rooms.map(r => <option key={r.id} value={r.name}>{r.name} ({r.capacity} pl)</option>)}
        </select>
      </div>
    </div>
  );
}
