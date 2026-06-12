import { useState } from 'react';
import { supabase } from '../lib/supabase';
import styles from './ActView.module.css';

const TYPE_OPTIONS = [
  { value: 'river',         label: 'River related / Relacionado al río' },
  { value: 'deforestation', label: 'Deforestation / Desmonte' },
  { value: 'fire',          label: 'Fire / Incendio' },
  { value: 'contamination', label: 'Contamination / Contaminación' },
  { value: 'poaching',      label: 'Poaching & illegal fishing / Caza y pesca ilegal' },
  { value: 'testimony',     label: 'Testimony / Testimonio' },
  { value: 'other',         label: 'Other / Otro' },
];

const EVIDENCE_OPTIONS = [
  { value: 'photo_video',        label: 'Photo or video / Foto o video' },
  { value: 'satellite',          label: 'Satellite image / Imagen satelital' },
  { value: 'document',           label: 'Official document or report / Documento o informe oficial' },
  { value: 'direct_observation', label: 'Direct observation / Observación directa' },
  { value: 'secondhand',         label: 'Secondhand account / Relato de terceros' },
  { value: 'other',              label: 'Other / Otro' },
];

const CONFIDENCE_OPTIONS = [
  { value: 'witnessed', label: 'I witnessed this directly / Lo presencié directamente' },
  { value: 'confident', label: "I'm fairly confident / Estoy bastante seguro/a" },
  { value: 'suspicion', label: "It's a suspicion / Es una sospecha" },
];

const INIT = {
  title: '', type_of_event: '', description: '',
  evidence_type: '', evidence_detail: '', confidence: '',
  date_of_event: '', name: '', contact: '', notes: '',
};

export default function ActView({ actPin, onClearPin }) {
  const [form, setForm]         = useState(INIT);
  const [errors, setErrors]     = useState({});
  const [submitting, setSubmit] = useState(false);
  const [submitted, setDone]    = useState(false);
  const [submitErr, setErr]     = useState(null);

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
      setErr('Submission failed. Please try again.');
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
      <aside className={styles.panel}>
        <div className={styles.scroll}>
          <div className={styles.success}>
            <div className={styles.successMark}>✓</div>
            <p className={styles.successTitle}>Observation submitted</p>
            <p className={styles.successText}>
              Your submission is under review. Once verified, it will appear on the community layer in the Discover panel.
            </p>
            <button className={styles.resetBtn} onClick={reset}>Submit another</button>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className={styles.panel}>
      <div className={styles.scroll}>

        <header className={styles.header}>
          <p className={styles.title}>Act / Actuar</p>
          <p className={styles.intro}>
            This space is for collective care of the Bermejo. Submit observations of fire, contamination,
            illegal extraction, or anything affecting the land and the people who depend on it.
            All submissions are reviewed before appearing on the map.
          </p>
        </header>

        <div className={styles.divider} />

        <form onSubmit={handleSubmit} noValidate>

          <div className={styles.field}>
            <label className={styles.label}>Title <span className={styles.required}>*</span></label>
            <input
              type="text"
              value={form.title}
              onChange={set('title')}
              className={`${styles.input} ${errors.title ? styles.inputError : ''}`}
              placeholder="Brief title for this observation"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Type of event <span className={styles.required}>*</span></label>
            <select
              value={form.type_of_event}
              onChange={set('type_of_event')}
              className={`${styles.select} ${errors.type_of_event ? styles.inputError : ''}`}
            >
              <option value="">Select...</option>
              {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Description <span className={styles.required}>*</span></label>
            <textarea
              value={form.description}
              onChange={set('description')}
              className={`${styles.textarea} ${errors.description ? styles.inputError : ''}`}
              placeholder="What did you observe? Include as much detail as you can."
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Evidence type <span className={styles.required}>*</span></label>
            <select
              value={form.evidence_type}
              onChange={set('evidence_type')}
              className={`${styles.select} ${errors.evidence_type ? styles.inputError : ''}`}
            >
              <option value="">Select...</option>
              {EVIDENCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Evidence detail <span className={styles.required}>*</span></label>
            <textarea
              value={form.evidence_detail}
              onChange={set('evidence_detail')}
              className={`${styles.textarea} ${errors.evidence_detail ? styles.inputError : ''}`}
              placeholder="Describe or link your evidence — photo URL, document reference, firsthand account..."
              style={{ minHeight: 52 }}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Confidence <span className={styles.required}>*</span></label>
            <select
              value={form.confidence}
              onChange={set('confidence')}
              className={`${styles.select} ${errors.confidence ? styles.inputError : ''}`}
            >
              <option value="">Select...</option>
              {CONFIDENCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Date of event <span className={styles.required}>*</span></label>
            <input
              type="date"
              value={form.date_of_event}
              onChange={set('date_of_event')}
              className={`${styles.input} ${errors.date_of_event ? styles.inputError : ''}`}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Location <span className={styles.required}>*</span></label>
            <div className={`${styles.locationBox} ${errors.location ? styles.locationBoxError : ''}`}>
              {actPin ? (
                <>
                  <p className={styles.locationCoords}>{actPin.lat}°, {actPin.lng}°</p>
                  <p className={styles.locationHint}>Click map to move the pin</p>
                </>
              ) : (
                <>
                  <p className={styles.locationPrompt}>Click the map to drop a pin</p>
                  {errors.location && <p className={styles.locationErrorMsg}>Location is required</p>}
                </>
              )}
            </div>
          </div>

          <div className={styles.divider} />
          <p className={styles.sectionOptional}>Optional</p>

          <div className={styles.field}>
            <label className={styles.label}>Name <span className={styles.optionalTag}>optional</span></label>
            <input
              type="text"
              value={form.name}
              onChange={set('name')}
              className={styles.input}
              placeholder="Your name or alias"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Contact <span className={styles.optionalTag}>optional</span></label>
            <input
              type="text"
              value={form.contact}
              onChange={set('contact')}
              className={styles.input}
              placeholder="Email or phone — never shown publicly"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Notes <span className={styles.optionalTag}>optional</span></label>
            <textarea
              value={form.notes}
              onChange={set('notes')}
              className={styles.textarea}
              placeholder="Anything else that might help verify this observation"
              style={{ minHeight: 52 }}
            />
          </div>

          <button type="submit" className={styles.submitBtn} disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit observation'}
          </button>

          {submitErr && <p className={styles.submitErrMsg}>{submitErr}</p>}

        </form>
      </div>
    </aside>
  );
}
