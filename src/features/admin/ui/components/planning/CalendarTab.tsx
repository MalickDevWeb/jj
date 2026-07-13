import React, { useState } from 'react';
import { CalendarSlot, UnassignedCourse, DAYS, SLOTS } from '../../../domain/PlanningModels';
import { CalendarToolbar } from './CalendarToolbar';
import { UnassignedList } from './UnassignedList';
import { useDeviceStore } from '@/features/screenguard/hooks/useDeviceStore';
import { MobileSchedulerView } from '@/features/screenguard/ui/components/MobileSchedulerView';
import { TabletSchedulerView } from '@/features/screenguard/ui/components/TabletSchedulerView';
import { exportPlanningToPDF } from '@/features/admin/utils/planningPdfExport';

interface CalendarSlotEditModalProps {
  slot: CalendarSlot;
  onClose: () => void;
  onSave: (updated: CalendarSlot) => void;
  onDelete: (id: string) => void;
}

export function CalendarSlotEditModal({ slot, onClose, onSave, onDelete }: CalendarSlotEditModalProps) {
  const [prof, setProf] = useState(slot.prof || '');
  const [room, setRoom] = useState(slot.room || '');
  const [category, setCategory] = useState<'cours' | 'devoir' | 'composition'>(slot.category || 'cours');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...slot, prof, room, category });
  };

  const activeCat = category;
  const exp = activeCat === 'cours' 
    ? { title: "📚 Cours Hebdomadaire", desc: "Cours académique régulier dispensé par le professeur assigné à cette matière.", style: "bg-blue-50/70 border-blue-200 text-blue-900" }
    : activeCat === 'devoir'
    ? { title: "📝 Devoir / Évaluation continue", desc: "Examen de contrôle continu (quiz, test rapide) planifié pendant les heures habituelles.", style: "bg-amber-50/70 border-amber-200 text-amber-900" }
    : { title: "🎓 Composition de Semestre", desc: "Examen de synthèse final et officiel, soumis à des règles académiques strictes.", style: "bg-rose-50/70 border-rose-200 text-rose-900" };

  return (
    <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-md z-[1000] flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl p-6 border border-neutral-200 w-full max-w-md space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
          <h3 className="font-extrabold text-[#1E293B] text-sm flex items-center gap-1.5">
            <span translate="no" className="material-symbols-outlined text-[#B3181C]">edit_calendar</span>
            <span>Modifier l'activité planifiée</span>
          </h3>
          <button type="button" onClick={onClose} className="text-neutral-400 hover:text-neutral-600 border-0 bg-transparent cursor-pointer">
            <span translate="no" className="material-symbols-outlined text-sm font-black">close</span>
          </button>
        </div>

        <div className="bg-neutral-50 p-3 rounded-xl text-[11px] font-semibold text-neutral-600 space-y-1 text-left">
          <div>Matière : <span className="font-black text-[#1E293B]">{slot.subject}</span></div>
          <div>Classe : <span className="font-bold text-[#B3181C]">{slot.classe}</span></div>
          <div>Créneau : <span className="font-bold text-neutral-800">{slot.day} — {slot.slot}</span></div>
        </div>

        {/* Category Selector */}
        <div className="text-left">
          <label className="text-[10px] uppercase font-black text-neutral-400">Type de Créneau (Activité)</label>
          <div className="grid grid-cols-3 gap-2 mt-1.5">
            {(['cours', 'devoir', 'composition'] as const).map((cat) => {
              const isActive = category === cat;
              return (
                <button
                  key={cat}
                  type="button"
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

        {/* Interactive explanation box */}
        <div className={`p-3 rounded-xl border text-[11px] leading-relaxed text-left ${exp.style}`}>
          <div className="font-extrabold mb-0.5">{exp.title}</div>
          <p className="font-medium opacity-90">{exp.desc}</p>
        </div>

        {/* Modify fields */}
        <div className="space-y-3 text-left">
          <div>
            <label className="text-[10px] uppercase font-black text-neutral-400 font-bold">Enseignant</label>
            <input
              type="text"
              value={prof}
              onChange={(e) => setProf(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-neutral-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#B3181C]"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase font-black text-neutral-400 font-bold">Salle de Classe</label>
            <input
              type="text"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-neutral-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#B3181C]"
            />
          </div>
        </div>

        <div className="flex justify-between items-center pt-3 border-t border-neutral-100">
          <button
            type="button"
            onClick={() => {
              onDelete(slot.id);
            }}
            className="text-[11px] font-bold text-red-600 hover:text-red-800 flex items-center gap-1 cursor-pointer border-0 bg-transparent"
          >
            <span translate="no" className="material-symbols-outlined text-xs">delete</span>
            <span>Retirer</span>
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-500 hover:bg-neutral-50 cursor-pointer bg-white"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-[#B3181C] text-white rounded-xl text-xs font-bold hover:bg-[#921316] cursor-pointer border-0"
            >
              Enregistrer
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

interface Props {
  slots: CalendarSlot[];
  unassigned: UnassignedCourse[];
  onSchedule: (courseId: string, day: string, slot: string) => void;
  onRemoveSlot: (id: string) => void;
  onUpdateSlot?: (updated: CalendarSlot) => void;
}

export function CalendarTab({ slots, unassigned, onSchedule, onRemoveSlot, onUpdateSlot }: Props) {
  const { isMobile, isTablet } = useDeviceStore();
  const [viewMode, setViewMode] = useState<'classe' | 'salle' | 'prof'>('classe');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverCell, setDragOverCell] = useState<string | null>(null);
  
  // Local state for clicking and editing a scheduled slot
  const [editingSlot, setEditingSlot] = useState<CalendarSlot | null>(null);

  const getCategoryStyles = (cat?: 'cours' | 'devoir' | 'composition') => {
    switch (cat) {
      case 'devoir':
        return {
          bg: "bg-amber-50 hover:bg-amber-100/80 border-amber-300 hover:border-amber-400 border-dashed text-amber-950 shadow-3xs",
          tag: "bg-amber-600/10 text-amber-800 border border-amber-200",
          text: "text-amber-950 font-extrabold",
          badge: "📝 DEVOIR"
        };
      case 'composition':
        return {
          bg: "bg-rose-50/90 hover:bg-rose-100/90 border-rose-300 hover:border-rose-400 [background-image:linear-gradient(45deg,rgba(179,24,28,0.02)_25%,transparent_25%,transparent_50%,rgba(179,24,28,0.02)_50%,rgba(179,24,28,0.02)_75%,transparent_75%,transparent)] bg-[size:16px_16px] text-rose-950 shadow-3xs",
          tag: "bg-rose-700 text-white",
          text: "text-rose-950 font-black",
          badge: "🎓 EXAMEN"
        };
      case 'cours':
      default:
        return {
          bg: "bg-blue-50/50 hover:bg-blue-100/60 border-blue-200/80 hover:border-blue-300/80 text-blue-950 shadow-3xs",
          tag: "bg-blue-600/10 text-blue-800 border border-blue-100",
          text: "text-blue-950",
          badge: "📚 COURS"
        };
    }
  };

  if (isMobile) {
    return <MobileSchedulerView slots={slots} />;
  }

  if (isTablet) {
    return (
      <TabletSchedulerView
        slots={slots}
        unassigned={unassigned}
        onSchedule={onSchedule}
        onRemoveSlot={onRemoveSlot}
      />
    );
  }

  const currentSlots = activeFilter === 'ALL' ? slots : slots.filter((s) => (viewMode === 'classe' ? s.classe === activeFilter : viewMode === 'salle' ? s.room === activeFilter : s.prof === activeFilter));
  const filterOptions = Array.from(new Set(slots.map((s) => viewMode === 'classe' ? s.classe : viewMode === 'salle' ? s.room : s.prof)));

  return (
    <div className="space-y-4" id="calendar-tab-root">
      <CalendarToolbar
        viewMode={viewMode}
        setViewMode={setViewMode}
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        filterOptions={filterOptions}
        onPrint={() => exportPlanningToPDF(slots, viewMode, activeFilter)}
      />

      {/* Visual Activities Legend */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-[#FAF8F6] p-3.5 border border-neutral-200 rounded-2xl">
        <div className="bg-blue-50 border border-blue-200 p-2.5 rounded-xl flex items-start gap-2.5">
          <span className="text-base shrink-0">📚</span>
          <div className="text-[10px]">
            <div className="font-extrabold text-blue-900 leading-none">Cours Hebdomadaire</div>
            <p className="text-neutral-500 font-medium mt-0.5 leading-tight">Session classique récurrente de transmission du savoir.</p>
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-200 border-dashed p-2.5 rounded-xl flex items-start gap-2.5">
          <span className="text-base shrink-0">📝</span>
          <div className="text-[10px]">
            <div className="font-extrabold text-amber-950 leading-none">Devoir (Évaluation Continue)</div>
            <p className="text-neutral-500 font-medium mt-0.5 leading-tight">Contrôle court sur table durant un créneau d'études habituel.</p>
          </div>
        </div>
        <div className="bg-rose-50 border border-rose-200 p-2.5 rounded-xl flex items-start gap-2.5 [background-image:linear-gradient(45deg,rgba(179,24,28,0.01)_25%,transparent_25%,transparent_50%,rgba(179,24,28,0.01)_50%,rgba(179,24,28,0.01)_75%,transparent_75%,transparent)] bg-[size:12px_12px]">
          <span className="text-base shrink-0">🎓</span>
          <div className="text-[10px]">
            <div className="font-extrabold text-rose-950 leading-none">Composition (Examen Semestriel)</div>
            <p className="text-neutral-500 font-medium mt-0.5 leading-tight">Examen final d'école officiel bloquant sous surveillance stricte.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
        <div className="lg:col-span-3 overflow-x-auto bg-white border border-neutral-200 rounded-2xl p-4 shadow-sm">
          <div className="min-w-[700px]">
            <div className="grid grid-cols-6 border-b border-neutral-200 pb-2 mb-2 text-center text-[10px] font-black text-neutral-400 uppercase tracking-widest">
              <div>Créneau</div>
              {DAYS.map((day) => <div key={day}>{day}</div>)}
            </div>

            {SLOTS.map((slotTime) => (
              <div key={slotTime} className="grid grid-cols-6 items-stretch min-h-[85px] border-b border-neutral-100 py-1.5">
                <div className="sticky left-0 bg-white flex flex-col justify-center items-center font-black text-neutral-500 text-[10px] pr-2 border-r border-neutral-100">
                  <span className="leading-tight text-neutral-800">{slotTime}</span>
                </div>

                {DAYS.map((day) => {
                  const cellId = `${day}-${slotTime}`;
                  const current = currentSlots.find((s) => s.day === day && s.slot === slotTime);
                  const isOver = dragOverCell === cellId;
                  const catStyle = current ? getCategoryStyles(current.category) : null;

                  return (
                    <div
                      key={day}
                      onDragOver={(e) => { e.preventDefault(); setDragOverCell(cellId); }}
                      onDragLeave={() => setDragOverCell(null)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragOverCell(null);
                        const id = e.dataTransfer.getData('courseId') || draggedId;
                        if (id) onSchedule(id, day, slotTime);
                      }}
                      onClick={() => {
                        if (current) setEditingSlot(current);
                      }}
                      className={`mx-1 p-2 rounded-xl border flex flex-col justify-between transition-all select-none ${
                        current 
                          ? `${catStyle?.bg} cursor-pointer hover:shadow-xs hover:scale-[1.01]` 
                          : isOver 
                          ? 'bg-emerald-50 border-emerald-400 border-dashed scale-[1.02]' 
                          : 'bg-neutral-50/40 border-neutral-200 border-dashed hover:bg-neutral-100/50'
                      }`}
                    >
                      {current ? (
                        <div className="relative group h-full flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start gap-1">
                              <div className="font-extrabold text-[10px] text-[#1E293B] leading-tight line-clamp-2">{current.subject}</div>
                              <span className="text-[7px] font-black uppercase tracking-wide opacity-80 shrink-0">{catStyle?.badge}</span>
                            </div>
                            <div className="text-[8px] font-black text-[#B3181C] uppercase mt-0.5">{current.classe}</div>
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-[8px] font-bold text-neutral-400 truncate max-w-[70px]">{current.prof}</span>
                            <span className="text-[7px] font-black bg-[#1E293B] text-white px-1.5 py-0.5 rounded">{current.room}</span>
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveSlot(current.id);
                            }} 
                            className="absolute -top-1 -right-1 bg-neutral-200 text-neutral-600 hover:bg-rose-600 hover:text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center"
                          >
                            <span translate="no" className="material-symbols-outlined text-[10px]">close</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-[8px] text-neutral-300 font-extrabold text-center my-auto select-none uppercase tracking-widest">Déposer</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        <UnassignedList unassigned={unassigned} setDraggedId={setDraggedId} />
      </div>

      {/* Editing Modal for Calendar Slot */}
      {editingSlot && (
        <CalendarSlotEditModal
          slot={editingSlot}
          onClose={() => setEditingSlot(null)}
          onSave={(updated) => {
            if (onUpdateSlot) onUpdateSlot(updated);
            setEditingSlot(null);
          }}
          onDelete={(id) => {
            onRemoveSlot(id);
            setEditingSlot(null);
          }}
        />
      )}
    </div>
  );
}
