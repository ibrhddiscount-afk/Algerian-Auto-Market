import { useState, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useCreateListing, type CreateListingRequest } from "@workspace/api-client-react";
import {
  ChevronRight, ChevronLeft, Check, Car, Truck, Zap,
  Upload, X, Plus, MapPin, Phone, User, Mail,
  AlertCircle, CheckCircle, Star,
} from "lucide-react";

const MARQUES = ["Audi","BMW","Chevrolet","Citroën","Dacia","Fiat","Ford","Honda","Hyundai",
  "Kia","Land Rover","Mercedes","Mitsubishi","Nissan","Opel","Peugeot","Renault",
  "Seat","Skoda","Suzuki","Toyota","Volkswagen","Autre"];

const MODELES: Record<string, string[]> = {
  Renault: ["Clio","Symbol","Megane","Duster","Kangoo","Trafic","Autre"],
  Peugeot: ["208","301","308","3008","Partner","Expert","Autre"],
  Volkswagen: ["Golf","Polo","Tiguan","Passat","Caddy","Transporter","Autre"],
  Hyundai: ["i10","i20","i30","Tucson","Santa Fe","Accent","Autre"],
  Dacia: ["Logan","Sandero","Duster","Lodgy","Dokker","Autre"],
  Toyota: ["Yaris","Corolla","Hilux","Land Cruiser","Avensis","Autre"],
  Kia: ["Picanto","Rio","Sportage","Sorento","Stonic","Autre"],
  BMW: ["Série 1","Série 3","Série 5","X1","X3","X5","Autre"],
  Mercedes: ["Classe A","Classe C","Classe E","GLA","GLC","Vito","Autre"],
};
const DEFAULT_MODELES = ["Autre"];

const WILAYAS = [
  "Adrar","Chlef","Laghouat","Oum El Bouaghi","Batna","Béjaïa","Biskra","Béchar",
  "Blida","Bouira","Tamanrasset","Tébessa","Tlemcen","Tiaret","Tizi Ouzou","Alger",
  "Djelfa","Jijel","Sétif","Saïda","Skikda","Sidi Bel Abbès","Annaba","Guelma",
  "Constantine","Médéa","Mostaganem","M'Sila","Mascara","Ouargla","Oran","El Bayadh",
  "Illizi","Bordj Bou Arréridj","Boumerdès","El Tarf","Tindouf","Tissemsilt",
  "El Oued","Khenchela","Souk Ahras","Tipaza","Mila","Aïn Defla","Naâma",
  "Aïn Témouchent","Ghardaïa","Relizane",
].sort();

const CARBURANTS = ["Essence","Diesel","GPL","Hybride","Électrique"];
const TRANSMISSIONS = ["Manuelle","Automatique"];
const COULEURS = ["Blanc","Noir","Gris","Argent","Rouge","Bleu","Vert","Jaune","Orange","Marron","Beige","Autre"];
const ETATS = ["Excellent","Très bon","Bon","Passable"];
const OPTIONS = [
  "Climatisation","Climatisation automatique","GPS / Navigation","Radar de recul",
  "Caméra de recul","Régulateur de vitesse","Toit ouvrant","Toit panoramique",
  "Sièges chauffants","Sièges en cuir","Bluetooth / AUX","USB","Jantes alliage",
  "Vitres électriques","Rétroviseurs électriques","ABS","ESP","Airbags",
  "Direction assistée","Démarrage sans clé","Système audio premium",
];

const VEHICLE_TYPES = [
  { id: "citadine", label: "Citadine", icon: <Car className="w-7 h-7" /> },
  { id: "berline", label: "Berline", icon: <Car className="w-7 h-7" /> },
  { id: "suv", label: "SUV / 4x4", icon: <Truck className="w-7 h-7" /> },
  { id: "utilitaire", label: "Utilitaire", icon: <Truck className="w-7 h-7" /> },
  { id: "electrique", label: "Électrique", icon: <Zap className="w-7 h-7" /> },
  { id: "autre", label: "Autre", icon: <Car className="w-7 h-7" /> },
];

const STEPS = [
  { id: 1, label: "Catégorie" },
  { id: 2, label: "Véhicule" },
  { id: 3, label: "Prix & État" },
  { id: 4, label: "Photos" },
  { id: 5, label: "Contact" },
];

interface FormData {
  vehicleType: string;
  marque: string;
  modele: string;
  autreModele: string;
  annee: string;
  km: string;
  carburant: string;
  transmission: string;
  couleur: string;
  portes: string;
  places: string;
  puissance: string;
  cylindree: string;
  prix: string;
  negociable: boolean;
  etat: string;
  premiereMain: boolean;
  dedouane: boolean;
  options: string[];
  description: string;
  photos: File[];
  nom: string;
  telephone: string;
  email: string;
  wilaya: string;
  ville: string;
  sellerType: "particulier" | "concessionnaire";
}

const DEFAULT_FORM: FormData = {
  vehicleType: "", marque: "", modele: "", autreModele: "", annee: "",
  km: "", carburant: "", transmission: "Manuelle", couleur: "", portes: "5",
  places: "5", puissance: "", cylindree: "", prix: "", negociable: false,
  etat: "Très bon", premiereMain: false, dedouane: true, options: [],
  description: "", photos: [], nom: "", telephone: "", email: "",
  wilaya: "", ville: "", sellerType: "particulier",
};

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between relative">
        {/* connector line */}
        <div className="absolute top-5 left-5 right-5 h-0.5 bg-gray-200 -z-0" />
        <div
          className="absolute top-5 left-5 h-0.5 bg-[#1a7a3c] transition-all duration-500 -z-0"
          style={{ width: `calc(${((step - 1) / (STEPS.length - 1)) * 100}% - 0px)` }}
        />
        {STEPS.map(s => (
          <div key={s.id} className="flex flex-col items-center gap-1.5 z-10">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 border-2 ${
              s.id < step  ? "bg-[#1a7a3c] border-[#1a7a3c] text-white"
              : s.id === step ? "bg-white border-[#1a7a3c] text-[#1a7a3c]"
              : "bg-white border-gray-200 text-gray-400"
            }`}>
              {s.id < step ? <Check className="w-4 h-4" /> : s.id}
            </div>
            <span className={`text-[10px] font-semibold hidden sm:block ${s.id === step ? "text-[#1a7a3c]" : "text-gray-400"}`}>
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({ label, required, children, hint }: { label: string; required?: boolean; children: React.ReactNode; hint?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

const inputCls = "w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#1a7a3c]/30 focus:border-[#1a7a3c] transition-colors placeholder-gray-300";
const selectCls = `${inputCls} appearance-none cursor-pointer`;
const DEFAULT_SUBMIT_ERROR = "Impossible de publier l'annonce pour le moment.";

function getSubmitErrorMessage(error: unknown): string {
  if (error instanceof globalThis.Error && error.message) return error.message;

  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }

  return DEFAULT_SUBMIT_ERROR;
}

export default function PostAd() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(DEFAULT_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createListing = useCreateListing();

  const set = <K extends keyof FormData>(key: K, val: FormData[K]) =>
    setForm(f => ({ ...f, [key]: val }));

  const toggleOption = (opt: string) =>
    set("options", form.options.includes(opt)
      ? form.options.filter(o => o !== opt)
      : [...form.options, opt]);

  const validateStep = (s: number): boolean => {
    const e: typeof errors = {};
    if (s === 1 && !form.vehicleType) e.vehicleType = "Sélectionnez un type de véhicule";
    if (s === 2) {
      if (!form.marque) e.marque = "Requis";
      if (!form.modele) e.modele = "Requis";
      if (form.modele === "Autre" && !form.autreModele.trim()) e.autreModele = "Précisez le modèle";
      if (!form.annee) e.annee = "Requis";
      if (!form.km) e.km = "Requis";
      if (!form.carburant) e.carburant = "Requis";
    }
    if (s === 3 && !form.prix) e.prix = "Requis";
    if (s === 5) {
      if (!form.nom.trim()) e.nom = "Requis";
      if (!form.telephone.trim()) e.telephone = "Requis";
      if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = "Email invalide";
      if (!form.wilaya) e.wilaya = "Requis";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validateStep(step)) { setSubmitError(null); setStep(s => s + 1); } };
  const prev = () => { setStep(s => s - 1); setErrors({}); setSubmitError(null); };

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files).filter(f => f.type.startsWith("image/")).slice(0, 10 - form.photos.length);
    set("photos", [...form.photos, ...arr]);
  }, [form.photos]);

  const toOptionalNumber = (value: string) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
  };

  const buildPayload = (): CreateListingRequest => {
    const modele = form.modele === "Autre" ? form.autreModele.trim() : form.modele;
    const location = [form.ville.trim(), form.wilaya].filter(Boolean).join(", ");

    return {
      vehicleType: form.vehicleType,
      marque: form.marque,
      modele,
      year: Number(form.annee),
      kmRaw: Number(form.km),
      fuel: form.carburant as CreateListingRequest["fuel"],
      transmission: form.transmission as CreateListingRequest["transmission"],
      location,
      wilaya: form.wilaya,
      priceRaw: Number(form.prix),
      description: form.description.trim() || undefined,
      couleur: form.couleur || undefined,
      portes: toOptionalNumber(form.portes),
      places: toOptionalNumber(form.places),
      puissance: toOptionalNumber(form.puissance),
      cylindree: form.cylindree.trim() || undefined,
      condition: form.etat as CreateListingRequest["condition"],
      firstHand: form.premiereMain,
      dedouane: form.dedouane,
      options: form.options,
      seller: {
        name: form.nom.trim(),
        email: form.email.trim() || undefined,
        phone: form.telephone.trim(),
        whatsapp: form.telephone.trim(),
        wilaya: form.wilaya,
        sellerType: form.sellerType,
      },
    };
  };

  const handleSubmit = async () => {
    if (!validateStep(5)) return;

    setSubmitError(null);

    try {
      const data = await createListing.mutateAsync(buildPayload());
      queryClient.setQueryData([`/api/listings/${data.listing.id}`], data);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/account"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/listings"] }),
        queryClient.invalidateQueries({ queryKey: [`/api/listings/${data.listing.id}`] }),
      ]);
      navigate(`/annonces/${data.listing.id}`);
    } catch (error) {
      setSubmitError(getSubmitErrorMessage(error));
    }
  };

  const modeles = form.marque ? (MODELES[form.marque] ?? DEFAULT_MODELES) : DEFAULT_MODELES;
  const isSubmitting = createListing.isPending;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
          <button onClick={() => navigate("/")} className="hover:text-[#1a7a3c]">Accueil</button>
          <span>›</span>
          <span className="text-gray-600 font-medium">Déposer une annonce</span>
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900">Déposer une annonce</h1>
        <p className="text-sm text-gray-500 mt-1">Gratuit · Rapide · Efficace</p>
      </div>

      <ProgressBar step={step} />

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">

        {/* ─ STEP 1: Category ─ */}
        {step === 1 && (
          <div>
            <h2 className="text-lg font-extrabold text-gray-900 mb-1">Type de véhicule</h2>
            <p className="text-sm text-gray-500 mb-5">Choisissez la catégorie qui correspond à votre véhicule.</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {VEHICLE_TYPES.map(t => (
                <button
                  key={t.id}
                  onClick={() => { set("vehicleType", t.id); setErrors({}); }}
                  className={`flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all ${
                    form.vehicleType === t.id
                      ? "border-[#1a7a3c] bg-[#f0faf4] text-[#1a7a3c]"
                      : "border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                    form.vehicleType === t.id ? "bg-[#1a7a3c]/10" : "bg-gray-100"
                  }`}>
                    {t.icon}
                  </div>
                  <span className="font-bold text-sm text-center">{t.label}</span>
                  {form.vehicleType === t.id && (
                    <div className="w-5 h-5 bg-[#1a7a3c] rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
            {errors.vehicleType && <FieldError msg={errors.vehicleType} />}

            {/* Seller type */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <h3 className="text-sm font-bold text-gray-700 mb-3">Vous êtes</h3>
              <div className="flex gap-3">
                {(["particulier","concessionnaire"] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => set("sellerType", t)}
                    className={`flex-1 flex items-center gap-2 justify-center py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                      form.sellerType === t
                        ? "border-[#1a7a3c] bg-[#f0faf4] text-[#1a7a3c]"
                        : "border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    {form.sellerType === t && <Check className="w-4 h-4" />}
                    {t === "particulier" ? "Un particulier" : "Un professionnel / concessionnaire"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─ STEP 2: Vehicle info ─ */}
        {step === 2 && (
          <div>
            <h2 className="text-lg font-extrabold text-gray-900 mb-1">Informations du véhicule</h2>
            <p className="text-sm text-gray-500 mb-5">Renseignez les caractéristiques de votre voiture.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Marque" required>
                <select className={selectCls} value={form.marque} onChange={e => { set("marque", e.target.value); set("modele", ""); }}>
                  <option value="">Sélectionner une marque</option>
                  {MARQUES.map(m => <option key={m}>{m}</option>)}
                </select>
                {errors.marque && <FieldError msg={errors.marque} />}
              </Field>

              <Field label="Modèle" required>
                <select className={selectCls} value={form.modele} onChange={e => set("modele", e.target.value)} disabled={!form.marque}>
                  <option value="">Sélectionner un modèle</option>
                  {modeles.map(m => <option key={m}>{m}</option>)}
                </select>
                {errors.modele && <FieldError msg={errors.modele} />}
              </Field>

              {form.modele === "Autre" && (
                <Field label="Préciser le modèle">
                  <input className={inputCls} placeholder="Ex: Scenic, Captur…" value={form.autreModele} onChange={e => set("autreModele", e.target.value)} />
                  {errors.autreModele && <FieldError msg={errors.autreModele} />}
                </Field>
              )}

              <Field label="Année" required>
                <select className={selectCls} value={form.annee} onChange={e => set("annee", e.target.value)}>
                  <option value="">Année</option>
                  {Array.from({ length: 35 }, (_, i) => 2024 - i).map(y => <option key={y}>{y}</option>)}
                </select>
                {errors.annee && <FieldError msg={errors.annee} />}
              </Field>

              <Field label="Kilométrage" required hint="En km, ex: 85000">
                <input
                  type="number" min="0" className={inputCls} placeholder="85 000"
                  value={form.km} onChange={e => set("km", e.target.value)}
                />
                {errors.km && <FieldError msg={errors.km} />}
              </Field>

              <Field label="Carburant" required>
                <div className="flex flex-wrap gap-2">
                  {CARBURANTS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => set("carburant", c)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        form.carburant === c
                          ? "bg-[#1a7a3c] border-[#1a7a3c] text-white"
                          : "border-gray-200 text-gray-600 hover:border-[#1a7a3c] hover:text-[#1a7a3c]"
                      }`}
                    >{c}</button>
                  ))}
                </div>
                {errors.carburant && <FieldError msg={errors.carburant} />}
              </Field>

              <Field label="Boîte de vitesses">
                <div className="flex gap-2">
                  {TRANSMISSIONS.map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => set("transmission", t)}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        form.transmission === t
                          ? "bg-[#1a7a3c] border-[#1a7a3c] text-white"
                          : "border-gray-200 text-gray-600 hover:border-[#1a7a3c] hover:text-[#1a7a3c]"
                      }`}
                    >{t}</button>
                  ))}
                </div>
              </Field>

              <Field label="Couleur">
                <div className="flex flex-wrap gap-2">
                  {COULEURS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => set("couleur", c)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        form.couleur === c
                          ? "bg-[#1a7a3c] border-[#1a7a3c] text-white"
                          : "border-gray-200 text-gray-600 hover:border-[#1a7a3c] hover:text-[#1a7a3c]"
                      }`}
                    >{c}</button>
                  ))}
                </div>
              </Field>

              <Field label="Nombre de portes">
                <div className="flex gap-2">
                  {["2","3","4","5"].map(n => (
                    <button key={n} type="button" onClick={() => set("portes", n)}
                      className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-all ${
                        form.portes === n ? "bg-[#1a7a3c] border-[#1a7a3c] text-white" : "border-gray-200 text-gray-600 hover:border-[#1a7a3c]"
                      }`}>{n}</button>
                  ))}
                </div>
              </Field>

              <Field label="Puissance (ch)" hint="Optionnel">
                <input type="number" min="0" className={inputCls} placeholder="Ex: 110" value={form.puissance} onChange={e => set("puissance", e.target.value)} />
              </Field>

              <Field label="Cylindrée" hint="Ex: 1.6 TDI, 2.0 HDi">
                <input className={inputCls} placeholder="Ex: 1.6 TDI" value={form.cylindree} onChange={e => set("cylindree", e.target.value)} />
              </Field>
            </div>
          </div>
        )}

        {/* ─ STEP 3: Price & condition ─ */}
        {step === 3 && (
          <div>
            <h2 className="text-lg font-extrabold text-gray-900 mb-1">Prix & État du véhicule</h2>
            <p className="text-sm text-gray-500 mb-5">Indiquez le prix et la condition générale de votre voiture.</p>

            <div className="space-y-5">
              {/* Price */}
              <Field label="Prix (DZD)" required hint="Entrez le prix en dinars algériens">
                <div className="relative">
                  <input
                    type="number" min="0" className={`${inputCls} pr-16`} placeholder="Ex: 2 500 000"
                    value={form.prix} onChange={e => set("prix", e.target.value)}
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">DZD</span>
                </div>
                {form.prix && (
                  <p className="text-xs text-[#1a7a3c] font-semibold mt-1">
                    ≈ {parseInt(form.prix).toLocaleString("fr-DZ")} DZD
                  </p>
                )}
                {errors.prix && <FieldError msg={errors.prix} />}
              </Field>

              {/* Négociable */}
              <label className="flex items-center gap-3 cursor-pointer group">
                <div
                  onClick={() => set("negociable", !form.negociable)}
                  className={`w-11 h-6 rounded-full transition-all relative ${form.negociable ? "bg-[#1a7a3c]" : "bg-gray-200"}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow absolute top-0.5 transition-all ${form.negociable ? "left-5" : "left-0.5"}`} />
                </div>
                <span className="text-sm font-medium text-gray-700">Prix négociable</span>
              </label>

              {/* État */}
              <Field label="État général">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {ETATS.map(e => (
                    <button
                      key={e} type="button" onClick={() => set("etat", e)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all text-center ${
                        form.etat === e ? "bg-[#1a7a3c] border-[#1a7a3c] text-white" : "border-gray-200 text-gray-600 hover:border-[#1a7a3c] hover:text-[#1a7a3c]"
                      }`}
                    >{e}</button>
                  ))}
                </div>
              </Field>

              {/* Première main + dédouané */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Toggle label="Première main" value={form.premiereMain} onChange={v => set("premiereMain", v)} />
                <Toggle label="Dédouané" value={form.dedouane} onChange={v => set("dedouane", v)} />
              </div>

              {/* Description */}
              <Field label="Description" hint="Décrivez l'état, l'historique, les points forts de votre véhicule">
                <textarea
                  rows={5}
                  className={`${inputCls} resize-none`}
                  placeholder="Ex: Voiture en excellent état, révision récente, carnet d'entretien complet, pneus neufs…"
                  value={form.description}
                  onChange={e => set("description", e.target.value)}
                />
                <p className="text-xs text-gray-400 text-right">{form.description.length} / 1000</p>
              </Field>

              {/* Options */}
              <Field label="Équipements & Options">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                  {OPTIONS.map(opt => (
                    <label key={opt} className="flex items-center gap-2.5 cursor-pointer group p-1.5 rounded-lg hover:bg-gray-50">
                      <div
                        onClick={() => toggleOption(opt)}
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                          form.options.includes(opt) ? "bg-[#1a7a3c] border-[#1a7a3c]" : "border-gray-300 group-hover:border-[#1a7a3c]"
                        }`}
                      >
                        {form.options.includes(opt) && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="text-sm text-gray-700">{opt}</span>
                    </label>
                  ))}
                </div>
                {form.options.length > 0 && (
                  <p className="text-xs text-[#1a7a3c] font-semibold mt-1">{form.options.length} option{form.options.length > 1 ? "s" : ""} sélectionnée{form.options.length > 1 ? "s" : ""}</p>
                )}
              </Field>
            </div>
          </div>
        )}

        {/* ─ STEP 4: Photos ─ */}
        {step === 4 && (
          <div>
            <h2 className="text-lg font-extrabold text-gray-900 mb-1">Photos du véhicule</h2>
            <p className="text-sm text-gray-500 mb-5">
              Ajoutez jusqu'à 10 photos. Une bonne annonce avec des photos claires attire 3× plus de contacts.
            </p>

            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${
                dragOver ? "border-[#1a7a3c] bg-[#f0faf4]" : "border-gray-200 hover:border-[#1a7a3c] hover:bg-gray-50"
              }`}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${dragOver ? "bg-[#1a7a3c]/10" : "bg-gray-100"}`}>
                <Upload className={`w-7 h-7 ${dragOver ? "text-[#1a7a3c]" : "text-gray-400"}`} />
              </div>
              <div className="text-center">
                <p className="font-bold text-gray-700">Glisser-déposer vos photos ici</p>
                <p className="text-sm text-gray-400 mt-0.5">ou <span className="text-[#1a7a3c] font-semibold">cliquer pour parcourir</span></p>
              </div>
              <p className="text-xs text-gray-400">JPG, PNG · Max 10 photos · Max 5 Mo par photo</p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={e => handleFiles(e.target.files)}
              />
            </div>

            {/* Photo previews */}
            {form.photos.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-700">{form.photos.length} photo{form.photos.length > 1 ? "s" : ""} ajoutée{form.photos.length > 1 ? "s" : ""}</p>
                  {form.photos.length < 10 && (
                    <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1 text-xs text-[#1a7a3c] font-semibold hover:underline">
                      <Plus className="w-3.5 h-3.5" /> Ajouter
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {form.photos.map((photo, i) => (
                    <div key={i} className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                      <img src={URL.createObjectURL(photo)} alt="" className="w-full h-full object-cover" />
                      {i === 0 && (
                        <div className="absolute bottom-0 left-0 right-0 bg-[#1a7a3c] text-white text-[9px] font-bold text-center py-0.5">
                          Photo principale
                        </div>
                      )}
                      <button
                        onClick={e => { e.stopPropagation(); set("photos", form.photos.filter((_, j) => j !== i)); }}
                        className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                  {form.photos.length < 10 && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-xl border-2 border-dashed border-gray-200 hover:border-[#1a7a3c] flex items-center justify-center transition-colors"
                    >
                      <Plus className="w-6 h-6 text-gray-300" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Tips */}
            <div className="mt-5 bg-blue-50 border border-blue-100 rounded-2xl p-4">
              <p className="text-xs font-bold text-blue-700 mb-2 flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5" /> Conseils pour de meilleures photos
              </p>
              <ul className="space-y-1 text-xs text-blue-600">
                {["Prenez des photos en plein jour, à l'extérieur","Photographiez tous les angles : avant, arrière, profils, intérieur","Montrez le tableau de bord et le compteur kilométrique","Signalez les éventuels défauts (rayures, bosses) avec transparence"].map(t => (
                  <li key={t} className="flex items-start gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* ─ STEP 5: Contact ─ */}
        {step === 5 && (
          <div>
            <h2 className="text-lg font-extrabold text-gray-900 mb-1">Vos coordonnées</h2>
            <p className="text-sm text-gray-500 mb-5">Vos informations de contact pour que les acheteurs puissent vous joindre.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Nom complet" required>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    className={`${inputCls} pl-10`} placeholder="Ex: Ahmed Belkacem"
                    value={form.nom} onChange={e => set("nom", e.target.value)}
                  />
                </div>
                {errors.nom && <FieldError msg={errors.nom} />}
              </Field>

              <Field label="Numéro de téléphone" required>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel" className={`${inputCls} pl-10`} placeholder="05XX XX XX XX"
                    value={form.telephone} onChange={e => set("telephone", e.target.value)}
                  />
                </div>
                {errors.telephone && <FieldError msg={errors.telephone} />}
              </Field>

              <Field label="Email" hint="Optionnel — pour recevoir les messages">
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email" className={`${inputCls} pl-10`} placeholder="exemple@email.com"
                    value={form.email} onChange={e => set("email", e.target.value)}
                  />
                </div>
                {errors.email && <FieldError msg={errors.email} />}
              </Field>

              <Field label="Wilaya" required>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    className={`${selectCls} pl-10`}
                    value={form.wilaya} onChange={e => set("wilaya", e.target.value)}
                  >
                    <option value="">Sélectionner une wilaya</option>
                    {WILAYAS.map(w => <option key={w}>{w}</option>)}
                  </select>
                </div>
                {errors.wilaya && <FieldError msg={errors.wilaya} />}
              </Field>

              <div className="sm:col-span-2">
                <Field label="Ville / Commune" hint="Optionnel">
                  <input className={inputCls} placeholder="Ex: Alger Centre, Bab El Oued…" value={form.ville} onChange={e => set("ville", e.target.value)} />
                </Field>
              </div>
            </div>

            {/* Summary card */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <h3 className="text-sm font-bold text-gray-700 mb-3">Récapitulatif de l'annonce</h3>
              <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
                <SummaryRow label="Véhicule" value={[form.marque, form.modele, form.annee].filter(Boolean).join(" · ") || "—"} />
                <SummaryRow label="Kilométrage" value={form.km ? `${parseInt(form.km).toLocaleString("fr-DZ")} km` : "—"} />
                <SummaryRow label="Carburant" value={form.carburant || "—"} />
                <SummaryRow label="Boîte" value={form.transmission} />
                <SummaryRow label="État" value={form.etat} />
                <SummaryRow label="Prix" value={form.prix ? `${parseInt(form.prix).toLocaleString("fr-DZ")} DZD${form.negociable ? " (négociable)" : ""}` : "—"} highlight />
                <SummaryRow label="Photos" value={`${form.photos.length} photo${form.photos.length !== 1 ? "s" : ""}`} />
              </div>
            </div>

            {/* Terms */}
            <div className="mt-4 flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">
                En publiant, vous acceptez les <a href="#" className="underline font-semibold">Conditions Générales d'Utilisation</a> d'AutoDZ. 
                Votre annonce sera visible gratuitement pendant 30 jours.
              </p>
            </div>

            {submitError && (
              <div className="mt-4 flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs font-semibold text-red-700">{submitError}</p>
              </div>
            )}
          </div>
        )}

        {/* ─ Navigation ─ */}
        <div className={`flex gap-3 mt-8 pt-6 border-t border-gray-100 ${step === 1 ? "justify-end" : "justify-between"}`}>
          {step > 1 && (
            <button
              onClick={prev}
              className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Précédent
            </button>
          )}
          {step < STEPS.length ? (
            <button
              onClick={next}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#1a7a3c] hover:bg-[#15632f] text-white rounded-xl text-sm font-bold transition-colors ml-auto"
            >
              Suivant <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-8 py-2.5 bg-[#1a7a3c] hover:bg-[#15632f] disabled:bg-gray-300 disabled:shadow-none text-white rounded-xl text-sm font-bold transition-colors shadow-lg shadow-[#1a7a3c]/30"
            >
              <CheckCircle className="w-4 h-4" /> {isSubmitting ? "Publication..." : "Publier mon annonce"}
            </button>
          )}
        </div>
      </div>

      {/* Free guarantee */}
      <div className="mt-4 flex items-center justify-center gap-6 text-xs text-gray-400">
        <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-[#1a7a3c]" /> 100% gratuit</span>
        <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-[#1a7a3c]" /> Visible 30 jours</span>
        <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-[#1a7a3c]" /> Annonce vérifiée</span>
      </div>
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`flex-1 flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all ${
        value ? "border-[#1a7a3c] bg-[#f0faf4]" : "border-gray-200 bg-white"
      }`}
    >
      <span className={`text-sm font-semibold ${value ? "text-[#1a7a3c]" : "text-gray-600"}`}>{label}</span>
      <div className={`w-10 h-5 rounded-full transition-all relative ${value ? "bg-[#1a7a3c]" : "bg-gray-200"}`}>
        <div className={`w-4 h-4 bg-white rounded-full shadow absolute top-0.5 transition-all ${value ? "left-5" : "left-0.5"}`} />
      </div>
    </button>
  );
}

function FieldError({ msg }: { msg: string }) {
  return (
    <p className="flex items-center gap-1 text-xs text-red-500 mt-0.5">
      <AlertCircle className="w-3 h-3" /> {msg}
    </p>
  );
}

function SummaryRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-500">{label}</span>
      <span className={`text-xs font-bold ${highlight ? "text-[#1a7a3c] text-sm" : "text-gray-700"}`}>{value}</span>
    </div>
  );
}
