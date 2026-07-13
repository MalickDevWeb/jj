import React, { useState, useEffect } from 'react';
import { BulletinLivePreview } from '@/features/grades/ui/components/BulletinLivePreview';
import { PREVIOUS_YEARS } from '@/features/grades/ui/components/GradesData';
import { uploadToCloudinary } from '@/shared/utils/cloudinaryUpload';

interface BulletinSettings {
  studentName: string;
  level: string;
  academicYear: string;
  specialty: string;
  signature: string;
  themeColor: 'red' | 'blue' | 'green' | 'gold';
  logoUrl: string;
}

export function BulletinCustomizerTab() {
  const [settings, setSettings] = useState<BulletinSettings>({
    studentName: 'Oumou Teuw',
    level: 'Tronc Commun',
    academicYear: '2021-2022',
    specialty: "Sciences & Technologies de l'Ingénieur",
    signature: 'Le Conseil de Direction Académique',
    themeColor: 'red',
    logoUrl: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{ message: string; success: boolean } | null>(null);

  useEffect(() => {
    fetch('/api/bulletin-settings')
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        setSettings({
          studentName: data.studentName || 'Oumou Teuw',
          level: data.level || 'Tronc Commun',
          academicYear: data.academicYear || '2021-2022',
          specialty: data.specialty || "Sciences & Technologies de l'Ingénieur",
          signature: data.signature || 'Le Conseil de Direction Académique',
          themeColor: data.themeColor || 'red',
          logoUrl: data.logoUrl || '',
        });
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const showToast = (message: string, success: boolean) => {
    setToast({ message, success });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await fetch('/api/admin/bulletin-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!response.ok) throw new Error('Erreur de sauvegarde');
      showToast('Configuration du bulletin mise à jour avec succès.', true);
    } catch {
      showToast('Échec de la mise à jour de la configuration.', false);
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      setSettings((prev) => ({ ...prev, logoUrl: url }));
      showToast('Logo téléversé avec succès sur Cloudinary !', true);
    } catch {
      showToast('Erreur lors du téléversement du logo.', false);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12" id="bulletin-tab-loader">
        <span translate="no" className="material-symbols-outlined text-3xl text-[#B3181C] animate-spin">
          progress_activity
        </span>
      </div>
    );
  }

  // Use PREVIOUS_YEARS[1] (which is the Tronc Commun year 2021-2022) as preview reference data
  const previewYear = PREVIOUS_YEARS[1] || PREVIOUS_YEARS[0];

  return (
    <div className="space-y-6" id="bulletin-customizer-tab-root">
      {/* Header Info */}
      <div className="border-b border-neutral-100 pb-4">
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <span translate="no" className="material-symbols-outlined text-lg text-[#B3181C]">
            tune
          </span>
          Charte Graphique & Bulletin de l'École
        </h3>
        <p className="text-xs text-neutral-500 mt-1">
          Personnalisez le bulletin officiel généré pour les étudiants. Seuls les administrateurs ont accès à cet écran.
        </p>
      </div>

      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-xl border text-xs font-black shadow-lg flex items-center gap-2 animate-bounce ${
            toast.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
          id="customizer-toast"
        >
          <span translate="no" className="material-symbols-outlined text-sm">
            {toast.success ? 'check_circle' : 'error'}
          </span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form panel */}
        <form onSubmit={handleSave} className="lg:col-span-7 space-y-5 bg-neutral-50/50 border border-neutral-150 p-5 rounded-2xl" id="admin-bulletin-form">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nom Etudiant */}
            <div className="space-y-1">
              <label className="text-[11px] font-black uppercase text-neutral-500">Nom Complet de l'Étudiant</label>
              <input
                type="text"
                value={settings.studentName}
                onChange={(e) => setSettings((p) => ({ ...p, studentName: e.target.value }))}
                className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-700 bg-white focus:outline-none focus:border-[#B3181C]"
                required
              />
            </div>

            {/* Niveau d'Etudes */}
            <div className="space-y-1">
              <label className="text-[11px] font-black uppercase text-neutral-500">Niveau d'Études</label>
              <input
                type="text"
                value={settings.level}
                onChange={(e) => setSettings((p) => ({ ...p, level: e.target.value }))}
                className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-700 bg-white focus:outline-none focus:border-[#B3181C]"
                required
              />
            </div>

            {/* Annee Academique */}
            <div className="space-y-1">
              <label className="text-[11px] font-black uppercase text-neutral-500">Année Académique</label>
              <input
                type="text"
                value={settings.academicYear}
                onChange={(e) => setSettings((p) => ({ ...p, academicYear: e.target.value }))}
                className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-700 bg-white focus:outline-none focus:border-[#B3181C]"
                required
              />
            </div>

            {/* Specialite */}
            <div className="space-y-1">
              <label className="text-[11px] font-black uppercase text-neutral-500">Spécialité / Filière</label>
              <input
                type="text"
                value={settings.specialty}
                onChange={(e) => setSettings((p) => ({ ...p, specialty: e.target.value }))}
                className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-700 bg-white focus:outline-none focus:border-[#B3181C]"
                required
              />
            </div>
          </div>

          {/* Autorite Signataire */}
          <div className="space-y-1">
            <label className="text-[11px] font-black uppercase text-neutral-500">Autorité Signataire</label>
            <input
              type="text"
              value={settings.signature}
              onChange={(e) => setSettings((p) => ({ ...p, signature: e.target.value }))}
              className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-700 bg-white focus:outline-none focus:border-[#B3181C]"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-neutral-150 pt-4">
            {/* Theme Color */}
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase text-neutral-500 block">Thème de Couleur</label>
              <div className="flex gap-2.5">
                {(['red', 'blue', 'green', 'gold'] as const).map((color) => {
                  const colorMap = {
                    red: 'bg-[#B3181C] hover:ring-rose-200',
                    blue: 'bg-[#1E293B] hover:ring-slate-200',
                    green: 'bg-emerald-600 hover:ring-emerald-200',
                    gold: 'bg-amber-500 hover:ring-amber-200',
                  };
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSettings((prev) => ({ ...prev, themeColor: color }))}
                      className={`w-8 h-8 rounded-full cursor-pointer transition-all ${colorMap[color]} ${
                        settings.themeColor === color ? 'ring-4 ring-offset-2 ring-neutral-400' : 'opacity-80 hover:opacity-100'
                      }`}
                      title={color}
                    />
                  );
                })}
              </div>
            </div>

            {/* School Logo */}
            <div className="space-y-1">
              <label className="text-[11px] font-black uppercase text-neutral-500 block">Logo de l'École (Cloudinary)</label>
              <div className="flex items-center gap-2">
                <label className="flex-grow flex items-center justify-center gap-2 border border-dashed border-neutral-300 rounded-xl py-2 px-3 bg-white hover:bg-neutral-50 cursor-pointer text-neutral-500 hover:text-neutral-700 transition-all">
                  <span translate="no" className="material-symbols-outlined text-sm">
                    {uploading ? 'sync' : 'upload'}
                  </span>
                  <span className="text-[11px] font-black uppercase">
                    {uploading ? 'Téléversement...' : 'Parcourir...'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
                {settings.logoUrl && (
                  <button
                    type="button"
                    onClick={() => setSettings((p) => ({ ...p, logoUrl: '' }))}
                    className="p-2 text-rose-500 hover:bg-rose-50 border border-neutral-200 rounded-xl cursor-pointer"
                    title="Supprimer le logo personnalisé"
                  >
                    <span translate="no" className="material-symbols-outlined text-sm font-bold">
                      delete
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {settings.logoUrl && (
            <div className="bg-white border border-neutral-200 p-2.5 rounded-xl flex items-center gap-3">
              <img
                src={settings.logoUrl}
                alt="Logo personnalisé"
                className="w-10 h-10 object-contain rounded border border-neutral-100"
              />
              <div className="truncate flex-1">
                <span className="text-[8px] font-black uppercase text-neutral-400 block">URL de stockage Neon</span>
                <span className="text-[9px] font-bold text-neutral-500 truncate block">{settings.logoUrl}</span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-4 border-t border-neutral-150 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-[#B3181C] text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-md hover:bg-red-800 transition-colors cursor-pointer"
            >
              <span translate="no" className="material-symbols-outlined text-sm font-bold">
                {saving ? 'sync' : 'save'}
              </span>
              <span>{saving ? 'Enregistrement...' : 'Enregistrer la Charte'}</span>
            </button>
          </div>
        </form>

        {/* Live Preview panel */}
        <div className="lg:col-span-5 space-y-3">
          <span className="text-[11px] font-black uppercase text-neutral-500 tracking-wider flex items-center gap-1">
            <span translate="no" className="material-symbols-outlined text-xs">
              visibility
            </span>
            Aperçu en Temps Réel
          </span>
          <div className="scale-95 origin-top-left xl:scale-100">
            <BulletinLivePreview
              year={previewYear}
              options={{
                studentName: settings.studentName,
                specialty: settings.specialty,
                level: settings.level,
                academicYear: settings.academicYear,
                signature: settings.signature,
                themeColor: settings.themeColor,
                logoUrl: settings.logoUrl || undefined,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
