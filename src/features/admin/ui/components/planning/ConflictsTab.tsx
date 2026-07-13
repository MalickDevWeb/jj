import React, { useState } from 'react';
import { ConflictAlert, CalendarSlot, DAYS, SLOTS } from '../../../domain/PlanningModels';

interface Props {
  conflicts: ConflictAlert[];
  onClearConflict: (id: string) => void;
  onClearAll: () => void;
  slots: CalendarSlot[];
  onRemoveSlot: (id: string) => void;
  onUpdateSlot?: (updated: CalendarSlot) => void;
}

interface ConflictInfo {
  type: 'Salle' | 'Enseignant' | 'Classe';
  item: string;
  day: string;
  slot: string;
  slots: CalendarSlot[];
}

export function ConflictsTab({
  conflicts,
  onClearConflict,
  onClearAll,
  slots,
  onRemoveSlot,
  onUpdateSlot,
}: Props) {
  // Navigation: 'alerts' (classic list) | 'matrix_rooms' | 'matrix_teachers'
  const [activeSubTab, setActiveSubTab] = useState<'alerts' | 'matrix_rooms' | 'matrix_teachers'>('matrix_rooms');
  
  // Matrix filters
  const [selectedDay, setSelectedDay] = useState<string>('Lundi');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showOnlyConflicts, setShowOnlyConflicts] = useState<boolean>(false);

  // Cell Details Modal
  const [selectedCell, setSelectedCell] = useState<{
    type: 'room' | 'prof';
    name: string;
    day: string;
    slot: string;
    cellSlots: CalendarSlot[];
  } | null>(null);

  // Slot Editing State (within modal)
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [editProf, setEditProf] = useState('');
  const [editRoom, setEditRoom] = useState('');
  const [editDay, setEditDay] = useState('');
  const [editSlot, setEditSlot] = useState('');

  // 1. Dynamic Conflict Detection Algorithm
  const detectAllConflicts = (allSlots: CalendarSlot[]): ConflictInfo[] => {
    const list: ConflictInfo[] = [];

    // Group by Day and Slot
    const daySlotGroups: { [key: string]: CalendarSlot[] } = {};
    allSlots.forEach((s) => {
      const key = `${s.day}|||${s.slot}`;
      if (!daySlotGroups[key]) daySlotGroups[key] = [];
      daySlotGroups[key].push(s);
    });

    Object.entries(daySlotGroups).forEach(([daySlotKey, cellSlots]) => {
      const [day, slot] = daySlotKey.split('|||');

      // Room conflicts: group by room
      const roomGroups: { [key: string]: CalendarSlot[] } = {};
      cellSlots.forEach((s) => {
        if (!s.room) return;
        if (!roomGroups[s.room]) roomGroups[s.room] = [];
        roomGroups[s.room].push(s);
      });
      Object.entries(roomGroups).forEach(([room, rSlots]) => {
        if (rSlots.length > 1) {
          list.push({ type: 'Salle', item: room, day, slot, slots: rSlots });
        }
      });

      // Teacher conflicts: group by prof
      const profGroups: { [key: string]: CalendarSlot[] } = {};
      cellSlots.forEach((s) => {
        if (!s.prof) return;
        if (!profGroups[s.prof]) profGroups[s.prof] = [];
        profGroups[s.prof].push(s);
      });
      Object.entries(profGroups).forEach(([prof, pSlots]) => {
        if (pSlots.length > 1) {
          list.push({ type: 'Enseignant', item: prof, day, slot, slots: pSlots });
        }
      });

      // Class conflicts: group by classe
      const classGroups: { [key: string]: CalendarSlot[] } = {};
      cellSlots.forEach((s) => {
        if (!s.classe) return;
        if (!classGroups[s.classe]) classGroups[s.classe] = [];
        classGroups[s.classe].push(s);
      });
      Object.entries(classGroups).forEach(([classe, cSlots]) => {
        if (cSlots.length > 1) {
          list.push({ type: 'Classe', item: classe, day, slot, slots: cSlots });
        }
      });
    });

    return list;
  };

  const detectedConflicts = detectAllConflicts(slots);

  // Extract rooms and teachers list dynamically
  const uniqueRooms = Array.from(
    new Set([
      ...slots.map((s) => s.room),
      'Salle 1 - Amphi A',
      'Salle 2 - Informatique',
      'Salle 3 - Labo GC',
    ].filter(Boolean))
  ).sort();

  const uniqueTeachers = Array.from(
    new Set([
      ...slots.map((s) => s.prof),
      'Dr. Diallo',
      'Mme. Sow',
      'Dr. Diop',
      'M. Ndiaye',
      'Dr. Aly Diatta',
    ].filter(Boolean))
  ).sort();

  // Filter lists based on search
  const filteredRooms = uniqueRooms.filter((r) =>
    r.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredTeachers = uniqueTeachers.filter((t) =>
    t.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Count conflicts by type
  const roomConflictsCount = detectedConflicts.filter((c) => c.type === 'Salle').length;
  const teacherConflictsCount = detectedConflicts.filter((c) => c.type === 'Enseignant').length;
  const classConflictsCount = detectedConflicts.filter((c) => c.type === 'Classe').length;

  const handleStartEdit = (slotToEdit: CalendarSlot) => {
    setEditingSlotId(slotToEdit.id);
    setEditProf(slotToEdit.prof || '');
    setEditRoom(slotToEdit.room || '');
    setEditDay(slotToEdit.day);
    setEditSlot(slotToEdit.slot);
  };

  const handleSaveEdit = (originalSlot: CalendarSlot) => {
    if (!onUpdateSlot) return;
    const updated = {
      ...originalSlot,
      prof: editProf,
      room: editRoom,
      day: editDay,
      slot: editSlot,
    };
    onUpdateSlot(updated);
    setEditingSlotId(null);

    // Update the local modal data state if we are inside cell view
    if (selectedCell) {
      const remainingInCell = selectedCell.cellSlots
        .map((s) => (s.id === originalSlot.id ? updated : s))
        // filter out slots that have been moved away from this cell
        .filter((s) => {
          if (selectedCell.type === 'room') {
            return s.room === selectedCell.name && s.day === selectedCell.day && s.slot === selectedCell.slot;
          } else {
            return s.prof === selectedCell.name && s.day === selectedCell.day && s.slot === selectedCell.slot;
          }
        });

      if (remainingInCell.length === 0) {
        setSelectedCell(null);
      } else {
        setSelectedCell({
          ...selectedCell,
          cellSlots: remainingInCell,
        });
      }
    }
  };

  const handleRemoveSlotInModal = (id: string) => {
    onRemoveSlot(id);
    if (selectedCell) {
      const remaining = selectedCell.cellSlots.filter((s) => s.id !== id);
      if (remaining.length === 0) {
        setSelectedCell(null);
      } else {
        setSelectedCell({
          ...selectedCell,
          cellSlots: remaining,
        });
      }
    }
  };

  return (
    <div className="space-y-5 text-xs font-bold text-[#4A5568]" id="conflicts-tab-root">
      {/* Top Title & Header block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-neutral-100">
        <div>
          <h3 className="font-extrabold text-[#1E293B] text-base flex items-center gap-2">
            <span translate="no" className="material-symbols-outlined text-rose-600 animate-pulse font-black text-xl">
              grid_on
            </span>
            <span>Matrice Diagnostique des Conflits</span>
          </h3>
          <p className="text-[10px] text-neutral-400 font-semibold mt-0.5">
            Outil d'audit algorithmique synchrone de chevauchement d'enseignants et de salles de classe.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-neutral-100 p-1 rounded-xl self-start md:self-center">
          <button
            onClick={() => setActiveSubTab('matrix_rooms')}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-black tracking-tight transition-all flex items-center gap-1.5 cursor-pointer border-0 ${
              activeSubTab === 'matrix_rooms'
                ? 'bg-white text-[#B3181C] shadow-xs'
                : 'text-neutral-500 hover:text-neutral-800 bg-transparent'
            }`}
          >
            <span translate="no" className="material-symbols-outlined text-xs">meeting_room</span>
            <span>Matrice Salles</span>
          </button>
          <button
            onClick={() => setActiveSubTab('matrix_teachers')}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-black tracking-tight transition-all flex items-center gap-1.5 cursor-pointer border-0 ${
              activeSubTab === 'matrix_teachers'
                ? 'bg-white text-[#B3181C] shadow-xs'
                : 'text-neutral-500 hover:text-neutral-800 bg-transparent'
            }`}
          >
            <span translate="no" className="material-symbols-outlined text-xs">badge</span>
            <span>Matrice Enseignants</span>
          </button>
          <button
            onClick={() => setActiveSubTab('alerts')}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-black tracking-tight transition-all flex items-center gap-1.5 cursor-pointer border-0 ${
              activeSubTab === 'alerts'
                ? 'bg-white text-[#B3181C] shadow-xs'
                : 'text-neutral-500 hover:text-neutral-800 bg-transparent'
            }`}
          >
            <span translate="no" className="material-symbols-outlined text-xs">warning_amber</span>
            <span>Alertes ({detectedConflicts.length})</span>
          </button>
        </div>
      </div>

      {/* Diagnostics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#FAF8F6] border border-neutral-200 rounded-2xl p-4 flex items-center justify-between shadow-3xs">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl border flex items-center justify-center ${
              roomConflictsCount > 0 ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-emerald-50 border-emerald-200 text-emerald-600'
            }`}>
              <span translate="no" className="material-symbols-outlined text-xl">room</span>
            </div>
            <div>
              <div className="text-[9px] text-neutral-400 font-black uppercase tracking-wider">Doubles-Salles</div>
              <div className="text-lg font-black text-[#1E293B]">{roomConflictsCount}</div>
            </div>
          </div>
          {roomConflictsCount > 0 && (
            <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded-md font-black">Collision</span>
          )}
        </div>

        <div className="bg-[#FAF8F6] border border-neutral-200 rounded-2xl p-4 flex items-center justify-between shadow-3xs">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl border flex items-center justify-center ${
              teacherConflictsCount > 0 ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-emerald-50 border-emerald-200 text-emerald-600'
            }`}>
              <span translate="no" className="material-symbols-outlined text-xl">person</span>
            </div>
            <div>
              <div className="text-[9px] text-neutral-400 font-black uppercase tracking-wider">Professeurs Occupés</div>
              <div className="text-lg font-black text-[#1E293B]">{teacherConflictsCount}</div>
            </div>
          </div>
          {teacherConflictsCount > 0 && (
            <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded-md font-black">Collision</span>
          )}
        </div>

        <div className="bg-[#FAF8F6] border border-neutral-200 rounded-2xl p-4 flex items-center justify-between shadow-3xs">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl border flex items-center justify-center ${
              classConflictsCount > 0 ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-emerald-50 border-emerald-200 text-emerald-600'
            }`}>
              <span translate="no" className="material-symbols-outlined text-xl">groups</span>
            </div>
            <div>
              <div className="text-[9px] text-neutral-400 font-black uppercase tracking-wider">Surcharges Promotions</div>
              <div className="text-lg font-black text-[#1E293B]">{classConflictsCount}</div>
            </div>
          </div>
          {classConflictsCount > 0 && (
            <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded-md font-black">Collision</span>
          )}
        </div>
      </div>

      {/* MATRIX FILTER BAR - Only shown for matrix sub-tabs */}
      {activeSubTab !== 'alerts' && (
        <div className="bg-[#FAF8F6] border border-neutral-200 rounded-2xl p-3.5 space-y-3 shadow-3xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Day Selector */}
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] uppercase font-black text-neutral-400 tracking-wider">Jour Sélectionné</label>
              <div className="flex flex-wrap gap-1.5">
                {DAYS.map((day) => (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                      selectedDay === day
                        ? 'bg-[#B3181C] text-white border-[#B3181C] shadow-xs'
                        : 'bg-white border-neutral-200 hover:bg-neutral-50 text-neutral-700'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            {/* Conflicts toggle filter & Search */}
            <div className="flex flex-wrap items-center gap-3 lg:self-end">
              <div className="relative">
                <input
                  type="text"
                  placeholder={activeSubTab === 'matrix_rooms' ? "Rechercher une salle..." : "Rechercher un professeur..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-2 border border-neutral-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#B3181C] w-48 sm:w-56"
                />
                <span translate="no" className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 text-base">
                  search
                </span>
              </div>

              <label className="flex items-center gap-2 cursor-pointer bg-white px-3.5 py-2 border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors select-none text-xs font-bold text-neutral-700">
                <input
                  type="checkbox"
                  checked={showOnlyConflicts}
                  onChange={(e) => setShowOnlyConflicts(e.target.checked)}
                  className="rounded text-[#B3181C] focus:ring-[#B3181C] h-4 w-4 cursor-pointer"
                />
                <span>Uniquement les conflits</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB CONTENTS */}

      {/* 1. CLASSIC ALERTS LIST */}
      {activeSubTab === 'alerts' && (
        <div className="bg-white border border-neutral-200 rounded-2xl p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-black text-[#1E293B] uppercase tracking-wider">
              Alertes Système Synthétisées ({detectedConflicts.length})
            </h4>
            {detectedConflicts.length > 0 && (
              <span className="text-[10px] text-neutral-400 font-semibold">
                Résolvez les conflits en modifiant ou retirant les créneaux ci-dessous ou via la Matrice.
              </span>
            )}
          </div>

          {detectedConflicts.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-2">
              <span translate="no" className="material-symbols-outlined text-4xl text-emerald-500 font-black">
                check_circle
              </span>
              <p className="text-xs font-black text-[#1E293B] uppercase tracking-wider">Aucun conflit détecté ! ✨</p>
              <p className="text-[10px] text-neutral-400 font-semibold max-w-sm">
                Toutes les salles, enseignants et promotions sont coordonnés sans aucune superposition temporelle.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {detectedConflicts.map((c, idx) => (
                <div
                  key={`${c.type}-${c.item}-${c.day}-${c.slot}-${idx}`}
                  className="p-4 border border-rose-200 bg-rose-50/45 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all hover:bg-rose-50/70"
                >
                  <div className="flex items-start gap-3 text-left">
                    <span translate="no" className="material-symbols-outlined text-xl text-rose-600 mt-0.5 shrink-0">
                      {c.type === 'Salle' ? 'meeting_room' : c.type === 'Enseignant' ? 'badge' : 'groups'}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                          Conflit {c.type}
                        </span>
                        <span className="text-[10px] text-neutral-500 font-bold">
                          {c.day} • {c.slot}
                        </span>
                      </div>
                      <p className="text-[#1E293B] font-extrabold text-xs mt-1.5 leading-relaxed">
                        Collision sur <span className="text-rose-700 underline underline-offset-2">{c.item}</span> le {c.day} à {c.slot} !
                      </p>
                      <div className="mt-2 space-y-1">
                        {c.slots.map((s) => (
                          <div key={s.id} className="text-[11px] font-semibold text-neutral-600 flex items-center gap-1">
                            <span className="text-rose-600">•</span>
                            <span>
                              <strong className="text-neutral-800">{s.subject}</strong> ({s.classe}) dispensé par{' '}
                              <strong>{s.prof}</strong> en <strong>{s.room}</strong>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedCell({
                        type: c.type === 'Salle' ? 'room' : 'prof',
                        name: c.item,
                        day: c.day,
                        slot: c.slot,
                        cellSlots: c.slots,
                      });
                    }}
                    className="self-end sm:self-center px-3.5 py-1.5 bg-white border border-rose-200 hover:border-rose-300 rounded-xl text-[#B3181C] hover:bg-rose-50 shadow-3xs transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    <span translate="no" className="material-symbols-outlined text-xs">tune</span>
                    <span>Corriger</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. VISUAL MATRIX ROOMS */}
      {activeSubTab === 'matrix_rooms' && (
        <div className="bg-white border border-neutral-200 rounded-2xl p-4 space-y-3 shadow-sm text-left">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
            <h4 className="text-[11px] font-black text-[#1E293B] uppercase tracking-wider">
              Occupation des Salles — {selectedDay}
            </h4>
            <span className="text-[10px] text-neutral-400 font-semibold">
              Cliquez sur un créneau pour modifier ou résoudre un conflit.
            </span>
          </div>

          <div className="overflow-x-auto border border-neutral-100 rounded-xl">
            <table className="w-full text-xs text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-100">
                  <th className="p-3 font-black text-[#1E293B] uppercase tracking-wider text-[10px] w-48 border-r border-neutral-100">
                    Salle de classe
                  </th>
                  {SLOTS.map((slot) => (
                    <th key={slot} className="p-3 font-black text-[#1E293B] uppercase tracking-wider text-[10px] text-center">
                      {slot}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredRooms.map((room) => {
                  // Compute row conflict check
                  const rowConflicts = detectedConflicts.filter(
                    (c) => c.type === 'Salle' && c.item === room && c.day === selectedDay
                  );

                  if (showOnlyConflicts && rowConflicts.length === 0) {
                    return null;
                  }

                  return (
                    <tr key={room} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="p-3 font-extrabold text-[#1E293B] border-r border-neutral-100 bg-neutral-50/20">
                        <div className="flex items-center gap-1.5">
                          <span translate="no" className="material-symbols-outlined text-[#B3181C] text-sm font-bold">
                            meeting_room
                          </span>
                          <span>{room}</span>
                        </div>
                        {rowConflicts.length > 0 && (
                          <span className="mt-1 block text-[8px] bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded-md font-black w-fit uppercase tracking-widest animate-pulse">
                            ⚠️ Collision
                          </span>
                        )}
                      </td>

                      {SLOTS.map((slot) => {
                        const cellSlots = slots.filter(
                          (s) => s.room === room && s.day === selectedDay && s.slot === slot
                        );

                        const isConflict = cellSlots.length > 1;

                        return (
                          <td
                            key={slot}
                            onClick={() => {
                              if (cellSlots.length > 0) {
                                setSelectedCell({
                                  type: 'room',
                                  name: room,
                                  day: selectedDay,
                                  slot,
                                  cellSlots,
                                });
                              }
                            }}
                            className={`p-2.5 transition-all cursor-pointer relative align-top text-center min-w-[130px] border-r border-neutral-100 last:border-r-0 ${
                              isConflict
                                ? 'bg-rose-50/80 hover:bg-rose-100/95 border-2 border-rose-300 shadow-inner'
                                : cellSlots.length === 1
                                ? 'bg-blue-50/30 hover:bg-blue-50/70 border border-transparent'
                                : 'bg-transparent hover:bg-neutral-100/40 text-neutral-300'
                            }`}
                          >
                            {cellSlots.length === 0 ? (
                              <div className="py-4 text-[10px] text-neutral-300 font-semibold italic">Disponible</div>
                            ) : isConflict ? (
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-center gap-1 text-[10px] font-black text-rose-700 bg-rose-100 border border-rose-200 px-1.5 py-0.5 rounded-lg w-fit mx-auto animate-bounce">
                                  <span translate="no" className="material-symbols-outlined text-[11px] font-black">
                                    error
                                  </span>
                                  <span>{cellSlots.length} Collisions</span>
                                </div>
                                <div className="text-left space-y-1 max-h-[85px] overflow-hidden">
                                  {cellSlots.map((s) => (
                                    <div key={s.id} className="text-[10px] leading-tight bg-white p-1 rounded-md border border-rose-200 font-semibold shadow-3xs">
                                      <div className="font-bold text-rose-950 truncate">{s.subject}</div>
                                      <div className="text-neutral-500 font-bold flex justify-between gap-1 text-[9px]">
                                        <span className="truncate">{s.classe}</span>
                                        <span className="text-[#B3181C] truncate">{s.prof}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div className="text-left bg-white p-1.5 rounded-xl border border-neutral-100 hover:border-neutral-200 transition-all shadow-3xs">
                                <div className="font-extrabold text-[#1E293B] text-[10px] truncate leading-tight">
                                  {cellSlots[0].subject}
                                </div>
                                <div className="text-[9px] text-neutral-500 font-bold mt-1 flex flex-col">
                                  <span className="text-[#B3181C] truncate font-black">{cellSlots[0].classe}</span>
                                  <span className="truncate opacity-80 mt-0.5">{cellSlots[0].prof}</span>
                                </div>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. VISUAL MATRIX TEACHERS */}
      {activeSubTab === 'matrix_teachers' && (
        <div className="bg-white border border-neutral-200 rounded-2xl p-4 space-y-3 shadow-sm text-left">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
            <h4 className="text-[11px] font-black text-[#1E293B] uppercase tracking-wider">
              Disponibilités & Charge des Enseignants — {selectedDay}
            </h4>
            <span className="text-[10px] text-neutral-400 font-semibold">
              Cliquez sur un créneau pour modifier ou résoudre un conflit.
            </span>
          </div>

          <div className="overflow-x-auto border border-neutral-100 rounded-xl">
            <table className="w-full text-xs text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-100">
                  <th className="p-3 font-black text-[#1E293B] uppercase tracking-wider text-[10px] w-48 border-r border-neutral-100">
                    Enseignant / Professeur
                  </th>
                  {SLOTS.map((slot) => (
                    <th key={slot} className="p-3 font-black text-[#1E293B] uppercase tracking-wider text-[10px] text-center">
                      {slot}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredTeachers.map((teacher) => {
                  // Compute row conflict check
                  const rowConflicts = detectedConflicts.filter(
                    (c) => c.type === 'Enseignant' && c.item === teacher && c.day === selectedDay
                  );

                  if (showOnlyConflicts && rowConflicts.length === 0) {
                    return null;
                  }

                  return (
                    <tr key={teacher} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="p-3 font-extrabold text-[#1E293B] border-r border-neutral-100 bg-neutral-50/20">
                        <div className="flex items-center gap-1.5">
                          <span translate="no" className="material-symbols-outlined text-[#B3181C] text-sm font-bold">
                            person
                          </span>
                          <span>{teacher}</span>
                        </div>
                        {rowConflicts.length > 0 && (
                          <span className="mt-1 block text-[8px] bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded-md font-black w-fit uppercase tracking-widest animate-pulse">
                            ⚠️ Collision
                          </span>
                        )}
                      </td>

                      {SLOTS.map((slot) => {
                        const cellSlots = slots.filter(
                          (s) => s.prof === teacher && s.day === selectedDay && s.slot === slot
                        );

                        const isConflict = cellSlots.length > 1;

                        return (
                          <td
                            key={slot}
                            onClick={() => {
                              if (cellSlots.length > 0) {
                                setSelectedCell({
                                  type: 'prof',
                                  name: teacher,
                                  day: selectedDay,
                                  slot,
                                  cellSlots,
                                });
                              }
                            }}
                            className={`p-2.5 transition-all cursor-pointer relative align-top text-center min-w-[130px] border-r border-neutral-100 last:border-r-0 ${
                              isConflict
                                ? 'bg-rose-50/80 hover:bg-rose-100/95 border-2 border-rose-300 shadow-inner'
                                : cellSlots.length === 1
                                ? 'bg-blue-50/30 hover:bg-blue-50/70 border border-transparent'
                                : 'bg-transparent hover:bg-neutral-100/40 text-neutral-300'
                            }`}
                          >
                            {cellSlots.length === 0 ? (
                              <div className="py-4 text-[10px] text-neutral-300 font-semibold italic">Disponible</div>
                            ) : isConflict ? (
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-center gap-1 text-[10px] font-black text-rose-700 bg-rose-100 border border-rose-200 px-1.5 py-0.5 rounded-lg w-fit mx-auto animate-bounce">
                                  <span translate="no" className="material-symbols-outlined text-[11px] font-black">
                                    error
                                  </span>
                                  <span>{cellSlots.length} Collisions</span>
                                </div>
                                <div className="text-left space-y-1 max-h-[85px] overflow-hidden">
                                  {cellSlots.map((s) => (
                                    <div key={s.id} className="text-[10px] leading-tight bg-white p-1 rounded-md border border-rose-200 font-semibold shadow-3xs">
                                      <div className="font-bold text-rose-950 truncate">{s.subject}</div>
                                      <div className="text-neutral-500 font-bold flex justify-between gap-1 text-[9px]">
                                        <span className="truncate">{s.classe}</span>
                                        <span className="text-[#B3181C] truncate">{s.room}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div className="text-left bg-white p-1.5 rounded-xl border border-neutral-100 hover:border-neutral-200 transition-all shadow-3xs">
                                <div className="font-extrabold text-[#1E293B] text-[10px] truncate leading-tight">
                                  {cellSlots[0].subject}
                                </div>
                                <div className="text-[9px] text-neutral-500 font-bold mt-1 flex flex-col">
                                  <span className="text-[#B3181C] truncate font-black">{cellSlots[0].classe}</span>
                                  <span className="truncate opacity-80 mt-0.5">{cellSlots[0].room}</span>
                                </div>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CELL DETAILS & REAL-TIME RESOLUTION MODAL */}
      {selectedCell && (
        <div className="fixed inset-0 bg-[#0F172A]/50 backdrop-blur-md z-[1001] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 border border-neutral-200 w-full max-w-xl space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div>
                <h3 className="font-extrabold text-[#1E293B] text-sm flex items-center gap-1.5">
                  <span translate="no" className="material-symbols-outlined text-[#B3181C]">
                    build_circle
                  </span>
                  <span>Résolution Diagnostique de Créneau</span>
                </h3>
                <p className="text-[10px] text-neutral-400 font-semibold mt-0.5">
                  Visualisation et correction en temps réel pour : <span className="font-bold text-neutral-700">{selectedCell.name}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedCell(null);
                  setEditingSlotId(null);
                }}
                className="text-neutral-400 hover:text-neutral-600 border-0 bg-transparent cursor-pointer flex items-center"
              >
                <span translate="no" className="material-symbols-outlined text-base font-black">
                  close
                </span>
              </button>
            </div>

            {/* Cell Context Badge */}
            <div className="bg-neutral-50 p-3 rounded-xl text-[11px] font-bold text-neutral-600 grid grid-cols-3 gap-2 border border-neutral-150">
              <div>
                Type : <span className="text-[#1E293B] font-black">{selectedCell.type === 'room' ? 'Salle' : 'Enseignant'}</span>
              </div>
              <div>
                Jour : <span className="text-neutral-800 font-black">{selectedCell.day}</span>
              </div>
              <div>
                Horaire : <span className="text-[#B3181C] font-black">{selectedCell.slot}</span>
              </div>
            </div>

            {/* List of sessions in this specific slot */}
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {selectedCell.cellSlots.map((slot) => {
                const isEditingThis = editingSlotId === slot.id;

                return (
                  <div
                    key={slot.id}
                    className={`p-4 rounded-xl border transition-all ${
                      selectedCell.cellSlots.length > 1
                        ? 'border-rose-200 bg-rose-50/20'
                        : 'border-neutral-200 bg-[#FAF8F6]'
                    }`}
                  >
                    {!isEditingThis ? (
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black bg-white border border-neutral-200 text-neutral-700 px-2 py-0.5 rounded-md">
                              Promotion: {slot.classe}
                            </span>
                            {selectedCell.cellSlots.length > 1 && (
                              <span className="text-[8px] font-black bg-rose-600 text-white px-1.5 py-0.5 rounded-sm uppercase tracking-wider animate-pulse">
                                Collision active
                              </span>
                            )}
                          </div>
                          <h4 className="text-xs font-black text-[#1E293B]">{slot.subject}</h4>
                          <p className="text-[10px] text-neutral-500 font-bold flex flex-wrap gap-x-3 gap-y-1">
                            <span className="flex items-center gap-1">
                              <span translate="no" className="material-symbols-outlined text-[11px] font-black text-[#B3181C]">
                                person
                              </span>
                              Enseignant : <strong className="text-neutral-700">{slot.prof}</strong>
                            </span>
                            <span className="flex items-center gap-1">
                              <span translate="no" className="material-symbols-outlined text-[11px] font-black text-[#B3181C]">
                                room
                              </span>
                              Salle : <strong className="text-neutral-700">{slot.room}</strong>
                            </span>
                          </p>
                        </div>

                        {/* Actions buttons */}
                        <div className="flex gap-1.5 self-end sm:self-start">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(slot)}
                            className="px-2.5 py-1.5 border border-neutral-200 hover:border-neutral-300 rounded-xl text-neutral-600 hover:text-neutral-900 bg-white text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <span translate="no" className="material-symbols-outlined text-xs">edit</span>
                            <span>Déplacer</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveSlotInModal(slot.id)}
                            className="px-2.5 py-1.5 border border-rose-200 hover:border-rose-300 rounded-xl text-rose-600 hover:bg-rose-50/50 bg-white text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <span translate="no" className="material-symbols-outlined text-xs text-rose-600">delete</span>
                            <span>Désassigner</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Editing Form for this specific slot */
                      <div className="space-y-3 bg-white p-3.5 border border-neutral-200 rounded-xl">
                        <div className="flex items-center justify-between border-b border-neutral-100 pb-1.5 mb-2">
                          <span className="text-[10px] uppercase font-black text-[#B3181C]">Réassigner le Créneau</span>
                          <button
                            type="button"
                            onClick={() => setEditingSlotId(null)}
                            className="text-neutral-400 hover:text-neutral-600 border-0 bg-transparent cursor-pointer font-black"
                          >
                            Annuler
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[9px] uppercase font-black text-neutral-400">Enseignant</label>
                            <input
                              type="text"
                              value={editProf}
                              onChange={(e) => setEditProf(e.target.value)}
                              className="w-full mt-1 px-2.5 py-1.5 border border-neutral-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-[#B3181C]"
                            />
                          </div>

                          <div>
                            <label className="text-[9px] uppercase font-black text-neutral-400">Salle de classe</label>
                            <input
                              type="text"
                              value={editRoom}
                              onChange={(e) => setEditRoom(e.target.value)}
                              className="w-full mt-1 px-2.5 py-1.5 border border-neutral-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-[#B3181C]"
                            />
                          </div>

                          <div>
                            <label className="text-[9px] uppercase font-black text-neutral-400">Jour</label>
                            <select
                              value={editDay}
                              onChange={(e) => setEditDay(e.target.value)}
                              className="w-full mt-1 px-2.5 py-1.5 border border-neutral-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-[#B3181C]"
                            >
                              {DAYS.map((d) => (
                                <option key={d} value={d}>
                                  {d}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="text-[9px] uppercase font-black text-neutral-400">Créneau horaire</label>
                            <select
                              value={editSlot}
                              onChange={(e) => setEditSlot(e.target.value)}
                              className="w-full mt-1 px-2.5 py-1.5 border border-neutral-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-[#B3181C]"
                            >
                              {SLOTS.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="flex justify-end gap-1.5 pt-2 border-t border-neutral-100">
                          <button
                            type="button"
                            onClick={() => setEditingSlotId(null)}
                            className="px-3 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-[10px] font-bold rounded-lg cursor-pointer border-0"
                          >
                            Annuler
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(slot)}
                            className="px-3.5 py-1 bg-[#B3181C] text-white text-[10px] font-bold rounded-lg hover:bg-[#921316] cursor-pointer border-0"
                          >
                            Confirmer & Enregistrer
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-2 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => {
                  setSelectedCell(null);
                  setEditingSlotId(null);
                }}
                className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-xl text-xs font-bold text-neutral-700 cursor-pointer border-0"
              >
                Fermer la vue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
