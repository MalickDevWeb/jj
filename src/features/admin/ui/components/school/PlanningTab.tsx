import React from 'react';
import { Room, Classe, PlanningSlot } from '../../../domain/SchoolModels';
import { PlanningSidebar } from './PlanningSidebar';
import { PlanningGrid } from './PlanningGrid';
import { SlotEditModal } from './SlotEditModal';
import { ConflictModal } from './ConflictModal';
import { DeleteConfirmInput } from './DeleteConfirmInput';
import { usePlanningTabState } from './usePlanningTabState';

interface Props {
  rooms: Room[];
  classes: Classe[];
  slots: PlanningSlot[];
  onUpdateSlots: (slots: PlanningSlot[]) => void;
}

export function PlanningTab({ rooms, classes, slots, onUpdateSlots }: Props) {
  const {
    selectedClassId,
    setSelectedClassId,
    errorToast,
    successToast,
    editingSlot,
    setEditingSlot,
    pendingConflict,
    setPendingConflict,
    clearingCell,
    setClearingCell,
    executeClearCell,
    handleDropItem,
    handleClearCell,
    handleSaveSlot,
    handleDeleteSlot,
  } = usePlanningTabState(classes, slots, onUpdateSlots);

  return (
    <div className="space-y-4" id="planning-tab-root">
      <div className="flex items-center justify-between bg-[#FAF8F6] p-4 border border-neutral-200 rounded-2xl">
        <div>
          <h3 className="font-extrabold text-[#1E293B] text-sm flex items-center gap-1.5">
            <span translate="no" className="material-symbols-outlined text-[#B3181C]">calendar_today</span>
            <span>Gestion des Emplois du Temps (Cours, Devoirs & Examens)</span>
          </h3>
          <p className="text-[10px] text-neutral-400 font-semibold">Gérez le planning complet en glissant/déposant. Double-cliquez sur un créneau pour définir son type d'évaluation.</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[10px] uppercase font-black text-neutral-400">Classe :</label>
          <select value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)} className="px-3 py-2 border border-neutral-200 rounded-xl bg-white text-xs font-bold focus:outline-none">
            {classes.map(cls => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
          </select>
        </div>
      </div>

      {/* Visual Legend for Activities */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-white border border-neutral-200 p-3.5 rounded-2xl shadow-3xs">
        <div className="bg-blue-50/40 border border-blue-200/60 p-2.5 rounded-xl flex items-start gap-2.5">
          <span className="text-lg shrink-0">📚</span>
          <div className="text-[10px]">
            <div className="font-extrabold text-blue-900 leading-none">Cours Hebdomadaire</div>
            <p className="text-neutral-500 font-medium mt-0.5 leading-tight">Session classique récurrente de transmission du savoir.</p>
          </div>
        </div>
        <div className="bg-amber-50/40 border border-amber-200/60 border-dashed p-2.5 rounded-xl flex items-start gap-2.5">
          <span className="text-lg shrink-0">📝</span>
          <div className="text-[10px]">
            <div className="font-extrabold text-amber-950 leading-none">Devoir (Évaluation Continue)</div>
            <p className="text-neutral-500 font-medium mt-0.5 leading-tight">Contrôle court sur table durant un créneau d'études habituel.</p>
          </div>
        </div>
        <div className="bg-rose-50/40 border border-rose-200/60 p-2.5 rounded-xl flex items-start gap-2.5 [background-image:linear-gradient(45deg,rgba(179,24,28,0.01)_25%,transparent_25%,transparent_50%,rgba(179,24,28,0.01)_50%,rgba(179,24,28,0.01)_75%,transparent_75%,transparent)] bg-[size:12px_12px]">
          <span className="text-lg shrink-0">🎓</span>
          <div className="text-[10px]">
            <div className="font-extrabold text-rose-950 leading-none">Composition (Examen Semestriel)</div>
            <p className="text-neutral-500 font-medium mt-0.5 leading-tight">Examen final d'école officiel bloquant sous surveillance stricte.</p>
          </div>
        </div>
      </div>

      {errorToast && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-bold px-4 py-3 rounded-xl flex items-center gap-2">
          <span translate="no" className="material-symbols-outlined text-lg">error</span>
          <span>{errorToast}</span>
        </div>
      )}

      {successToast && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2">
          <span translate="no" className="material-symbols-outlined text-lg">check_circle</span>
          <span>{successToast}</span>
        </div>
      )}

      <div className="flex gap-4 items-start">
        <PlanningGrid
          slots={slots}
          viewMode="class"
          selectedId={selectedClassId}
          onDropItem={handleDropItem}
          onClearCell={handleClearCell}
          onSelectSlot={setEditingSlot}
        />
        <PlanningSidebar rooms={rooms} classes={classes} />
      </div>

      {editingSlot && (
        <SlotEditModal
          slot={editingSlot}
          rooms={rooms}
          onClose={() => setEditingSlot(null)}
          onSave={handleSaveSlot}
          onDelete={handleDeleteSlot}
        />
      )}

      {pendingConflict && (
        <ConflictModal
          conflict={pendingConflict}
          onClose={() => setPendingConflict(null)}
          onForce={pendingConflict.onResolve}
        />
      )}

      {clearingCell && (
        <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-md z-[1000] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 border border-neutral-200 w-full max-w-md space-y-4">
            <h3 className="font-extrabold text-[#1E293B] text-sm flex items-center gap-1.5 border-b border-neutral-100 pb-2">
              <span translate="no" className="material-symbols-outlined text-[#B3181C]">security</span>
              <span>Confirmer la suppression du cours</span>
            </h3>
            <DeleteConfirmInput
              onConfirm={executeClearCell}
              onCancel={() => setClearingCell(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
