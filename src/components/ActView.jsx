import { useState } from 'react';
import { supabase } from '../lib/supabase';
import styles from './ActView.module.css';
import { useLang } from '../context/LangContext';

const TYPE_OPTIONS = {
  en: [
    { value: 'river',         label: 'River related / Relacionado al río' },
    { value: 'deforestation', label: 'Deforestation / Desmonte' },
    { value: 'fire',          label: 'Fire / Incendio' },
    { value: 'contamination', label: 'Contamination / Contaminación' },
    { value: 'poaching',      label: 'Poaching & illegal fishing / Caza y pesca ilegal' },
    { value: 'testimony',     label: 'Testimony / Testimonio' },
    { value: 'other',         label: 'Other / Otro' },
  ],
  es: [
    { value: 'river',         label: 'Relacionado al río' },
    { value: 'deforestation', label: 'Desmonte / Deforestación' },
    { value: 'fire',          label: 'Incendio' },
    { value: 'contamination', label: 'Contaminación' },
    { value: 'poaching',      label: 'Caza y pesca ilegal' },
    { value: 'testimony',     label: 'Testimonio' },
    { value: 'other',         label: 'Otro' },
  ],
};

const EVIDENCE_OPTIONS = {
  en: [
    { value: 'photo_video',        label: 'Photo or video / Foto o video' },
    { value: 'satellite',          label: 'Satellite image / Imagen satelital' },
    { value: 'document',           label: 'Official document or report / Documento o informe oficial' },
    { value: 'direct_observation', label: 'Direct observation / Observación directa' },
    { value: 'secondhand',         label: 'Secondhand account / Relato de terceros' },
    { value: 'other',              label: 'Other / Otro' },
  ],
  es: [
    { value: 'photo_video',        label: 'Foto o video' },
    { value: 'satellite',          label: 'Imagen satelital' },
    { value: 'document',           label: 'Documento o informe oficial' },
    { value: 'direct_observation', label: 'Observación directa' },
    { value: 'secondhand',         label: 'Relato de terceros' },
    { value: 'other',              label: 'Otro' },
  ],
};

const CONFIDENCE_OPTIONS = {
  en: [
    { value: 'witnessed', label: 'I witnessed this directly / Lo presencié directamente' },
    { value: 'confident', label: "I'm fairly confident / Estoy bastante seguro/a" },
    { value: 'suspicion', label: "It's a suspicion / Es una sospecha" },
  ],
  es: [
    { value: 'witnessed', label: 'Lo presencié directamente' },
    { value: 'confident', label: 'Estoy bastante seguro/a' },
    { value: 'suspicion', label: 'Es una sospecha' },
  ],
};

const T = {
  en: {
    title: 'Act',
    intro: 'This space is for collective care of the Bermejo. Submit observations of fire, contamination, illegal extraction, or anything affecting the land and the people who depend on it. All submissions are reviewed before appearing on the map.',
    labelTitle: 'Title',
    placeholderTitle: 'Brief title for this observation',
    labelType: 'Type of event',
    labelDesc: 'Description',
    placeholderDesc: 'What did you observe? Include as much detail as you can.',
    labelEvidenceType: 'Evidence type',
    labelEvidenceDetail: 'Upload Evidence',
    placeholderEvidenceDetail: 'Describe or link your evidence — photo URL, document reference, firsthand account... Make sure your evidence is freely accessible.',
    labelConfidence: 'Confidence',
    labelDate: 'Date of event',
    labelLocation: 'Location',
    locationPrompt: 'Click the map to drop a pin',
    locationError: 'Location is required',
    locationHint: 'Click map to move the pin',
    select: 'Select...',
    optional: 'Optional',
    labelName: 'Name',
    tagOptional: 'optional',
    placeholderName: 'Your name or alias',
    labelContact: 'Contact',
    placeholderContact: 'Email or phone — never shown publicly',
    labelNotes: 'Notes',
    placeholderNotes: 'Anything else that might help verify this observation',
    submit: 'Submit observation',
    submitting: 'Submitting…',
    submitErr: 'Submission failed. Please try again.',
    successMark: '✓',
    successTitle: 'Observation submitted',
    successText: 'Your submission is under review. Once verified, it will appear on the community layer in the Explore panel.',
    resetBtn: 'Submit another',
  },
  es: {
    title: 'Actuar',
    intro: 'Este espacio es para el cuidado colectivo del Bermejo. Enviá observaciones sobre incendios, contaminación, extracción ilegal, o cualquier cosa que afecte la tierra y a las personas que dependen de ella. Todos los envíos son revisados antes de aparecer en el mapa.',
    labelTitle: 'Título',
    placeholderTitle: 'Título breve para esta observación',
    labelType: 'Tipo de evento',
    labelDesc: 'Descripción',
    placeholderDesc: '¿Qué observaste? Incluí todos los detalles que puedas.',
    labelEvidenceType: 'Tipo de evidencia',
    labelEvidenceDetail: 'Subir evidencia',
    placeholderEvidenceDetail: 'Describí o enlazá tu evidencia — URL de foto, referencia de documento, relato de primera mano... Asegurate de que tu evidencia sea de libre acceso.',
    labelConfidence: 'Confianza',
    labelDate: 'Fecha del evento',
    labelLocation: 'Ubicación',
    locationPrompt: 'Hacé clic en el mapa para marcar un punto',
    locationError: 'La ubicación es obligatoria',
    locationHint: 'Hacé clic en el mapa para mover el punto',
    select: 'Seleccionar...',
    optional: 'Opcional',
    labelName: 'Nombre',
    tagOptional: 'opcional',
    placeholderName: 'Tu nombre o alias',
    labelContact: 'Contacto',
    placeholderContact: 'Email o teléfono — nunca se muestra públicamente',
    labelNotes: 'Notas',
    placeholderNotes: 'Cualquier otra cosa que pueda ayudar a verificar esta observación',
    submit: 'Enviar observación',
    submitting: 'Enviando…',
    submitErr: 'Error al enviar. Por favor, intentá de nuevo.',
    successMark: '✓',
    successTitle: 'Observación enviada',
    successText: 'Tu envío está siendo revisado. Una vez verificado, aparecerá en la capa comunitaria del panel Explorar.',
    resetBtn: 'Enviar otra',
  },
};

const INIT = {
  title: '', type_of_event: '', description: '',
  evidence_type: '', evidence_detail: '', confidence: '',
  date_of_event: '', name: '', contact: '', notes: '',
};

const SMALL_TAB = {
  position: 'fixed', top: '50%', transform: 'translateY(-50%)',
  zIndex: 11, width: 22, height: 56,
  background: 'var(--panel-bg)', border: '1px solid var(--panel-border)',
  borderLeft: 'none', borderRadius: '0 5px 5px 0',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', backdropFilter: 'blur(12px)',
  boxShadow: '2px 0 8px rgba(0,0,0,0.08)',
  fontSize: 14, color: 'var(--brown)', userSelect: 'none',
  padding: 0, transition: 'left 0.28s ease',
};

export default function ActView({ actPin, onClearPin }) {
  const [form, setForm]         = useState(INIT);
  const [errors, setErrors]     = useState({});
  const [submitting, setSubmit] = useState(false);
  const [submitted, setDone]    = useState(false);
  const [submitErr, setErr]     = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const { lang } = useLang();
  const t = T[lang] ?? T.en;
  const typeOptions     = TYPE_OPTIONS[lang]     ?? TYPE_OPTIONS.en;
  const evidenceOptions = EVIDENCE_OPTIONS[lang] ?? EVIDENCE_OPTIONS.en;
  const confidenceOptions = CONFIDENCE_OPTIONS[lang] ?? CONFIDENCE_OPTIONS.en;

  function set(field) {
    return (e) => {
      setForm(prev => ({ ...prev, [field]: e.target.value }));
      setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = {};
    if (!form.title.trim())            errs.title = true;
    if (!form.type_of_event)           errs.type_of_event = true;
    if (!form.description.trim())      errs.description = true;
    if (!form.evidence_type)           errs.evidence_type = true;
    if (!form.evidence_detail.trim())  errs.evidence_detail = true;
    if (!form.confidence)              errs.confidence = true;
    if (!form.date_of_event)           errs.date_of_event = true;
    if (!actPin)                       errs.location = true;
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSubmit(true);
    setErr(null);

    const { error } = await supabase.rpc('submit_observation', {
      p_title:           form.title.trim(),
      p_type_of_event:   form.type_of_event,
      p_description:     form.description.trim(),
      p_evidence_type:   form.evidence_type,
      p_evidence_detail: form.evidence_detail.trim(),
      p_confidence:      form.confidence,
      p_date_of_event:   form.date_of_event,
      p_latitude:        parseFloat(actPin.lat),
      p_longitude:       parseFloat(actPin.lng),
      p_name:            form.name.trim()    || null,
      p_contact:         form.contact.trim() || null,
      p_notes:           form.notes.trim()   || null,
    });

    setSubmit(false);
    if (error) {
      setErr(t.submitErr);
    } else {
      setDone(true);
      onClearPin();
    }
  }

  function reset() {
    setForm(INIT);
    setErrors({});
    setDone(false);
    setErr(null);
  }

  if (submitted) {
    return (
      <>
      <aside className={`${styles.panel}${collapsed ? ` ${styles.panelCollapsed}` : ''}`}>
        <div className={styles.scroll}>
          <div className={styles.success}>
            <div className={styles.successMark}>{t.successMark}</div>
            <p className={styles.successTitle}>{t.successTitle}</p>
            <p className={styles.successText}>{t.successText}</p>
            <button className={styles.resetBtn} onClick={reset}>{t.resetBtn}</button>
          </div>
        </div>
      </aside>
      <button
        onClick={() => setCollapsed(c => !c)}
        style={{ ...SMALL_TAB, left: collapsed ? '4px' : '380px' }}
        title={collapsed ? 'Expand panel' : 'Collapse panel'}
      >
        {collapsed ? '›' : '‹'}
      </button>
      </>
    );
  }

  return (
    <>
    <aside className={`${styles.panel}${collapsed ? ` ${styles.panelCollapsed}` : ''}`}>
      <div className={styles.scroll}>

        <header className={styles.header}>
          <p className={styles.title}>{t.title}</p>
          <p className={styles.intro}>{t.intro}</p>
        </header>

        <div className={styles.divider} />

        <form onSubmit={handleSubmit} noValidate>

          <div className={styles.field}>
            <label className={styles.label}>{t.labelTitle} <span className={styles.required}>*</span></label>
            <input
              type="text"
              value={form.title}
              onChange={set('title')}
              className={`${styles.input} ${errors.title ? styles.inputError : ''}`}
              placeholder={t.placeholderTitle}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>{t.labelType} <span className={styles.required}>*</span></label>
            <select
              value={form.type_of_event}
              onChange={set('type_of_event')}
              className={`${styles.select} ${errors.type_of_event ? styles.inputError : ''}`}
            >
              <option value="">{t.select}</option>
              {typeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>{t.labelDesc} <span className={styles.required}>*</span></label>
            <textarea
              value={form.description}
              onChange={set('description')}
              className={`${styles.textarea} ${errors.description ? styles.inputError : ''}`}
              placeholder={t.placeholderDesc}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>{t.labelEvidenceType} <span className={styles.required}>*</span></label>
            <select
              value={form.evidence_type}
              onChange={set('evidence_type')}
              className={`${styles.select} ${errors.evidence_type ? styles.inputError : ''}`}
            >
              <option value="">{t.select}</option>
              {evidenceOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>{t.labelEvidenceDetail} <span className={styles.required}>*</span></label>
            <textarea
              value={form.evidence_detail}
              onChange={set('evidence_detail')}
              className={`${styles.textarea} ${errors.evidence_detail ? styles.inputError : ''}`}
              placeholder={t.placeholderEvidenceDetail}
              style={{ minHeight: 52 }}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>{t.labelConfidence} <span className={styles.required}>*</span></label>
            <select
              value={form.confidence}
              onChange={set('confidence')}
              className={`${styles.select} ${errors.confidence ? styles.inputError : ''}`}
            >
              <option value="">{t.select}</option>
              {confidenceOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>{t.labelDate} <span className={styles.required}>*</span></label>
            <input
              type="date"
              value={form.date_of_event}
              onChange={set('date_of_event')}
              className={`${styles.input} ${errors.date_of_event ? styles.inputError : ''}`}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>{t.labelLocation} <span className={styles.required}>*</span></label>
            <div className={`${styles.locationBox} ${errors.location ? styles.locationBoxError : ''}`}>
              {actPin ? (
                <>
                  <p className={styles.locationCoords}>{actPin.lat}°, {actPin.lng}°</p>
                  <p className={styles.locationHint}>{t.locationHint}</p>
                  <button type="button" className={styles.locationClearBtn} onClick={onClearPin}>✕</button>
                </>
              ) : (
                <>
                  <p className={styles.locationPrompt}>{t.locationPrompt}</p>
                  {errors.location && <p className={styles.locationErrorMsg}>{t.locationError}</p>}
                </>
              )}
            </div>
          </div>

          <div className={styles.divider} />
          <p className={styles.sectionOptional}>{t.optional}</p>

          <div className={styles.field}>
            <label className={styles.label}>{t.labelName} <span className={styles.optionalTag}>{t.tagOptional}</span></label>
            <input
              type="text"
              value={form.name}
              onChange={set('name')}
              className={styles.input}
              placeholder={t.placeholderName}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>{t.labelContact} <span className={styles.optionalTag}>{t.tagOptional}</span></label>
            <input
              type="text"
              value={form.contact}
              onChange={set('contact')}
              className={styles.input}
              placeholder={t.placeholderContact}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>{t.labelNotes} <span className={styles.optionalTag}>{t.tagOptional}</span></label>
            <textarea
              value={form.notes}
              onChange={set('notes')}
              className={styles.textarea}
              placeholder={t.placeholderNotes}
              style={{ minHeight: 52 }}
            />
          </div>

          <button type="submit" className={styles.submitBtn} disabled={submitting}>
            {submitting ? t.submitting : t.submit}
          </button>

          {submitErr && <p className={styles.submitErrMsg}>{submitErr}</p>}

        </form>
      </div>
    </aside>

    <button
      onClick={() => setCollapsed(c => !c)}
      style={{ ...SMALL_TAB, left: collapsed ? '4px' : '380px' }}
      title={collapsed ? 'Expand panel' : 'Collapse panel'}
    >
      {collapsed ? '›' : '‹'}
    </button>
    </>
  );
}
