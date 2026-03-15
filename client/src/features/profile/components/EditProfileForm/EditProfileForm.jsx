import Input   from '../../../../components/ui/Input/Input';
import Button  from '../../../../components/ui/Button/Button';
import { LEVEL_LIST, getLevelConfig } from '../../../../constants/levels';
import { GENDERS, ACCENTS } from '../../../../constants/voices';
import styles from './EditProfileForm.module.css';

export default function EditProfileForm({ form, saving, saveError, onChange, onSave, onCancel }) {
  return (
    <div className={styles.wrapper}>
      <h3 className={styles.title}>Edit Profile</h3>
      {saveError && <p className={styles.error}>{saveError}</p>}

      <Input label="Full Name" name="name" value={form.name} onChange={onChange} leftIcon="👤" />

      {/* Preferred Level */}
      <div className={styles.field}>
        <label className={styles.label}>Preferred Level</label>
        <div className={styles.levelGrid}>
          {LEVEL_LIST.map(lvl => {
            const cfg = getLevelConfig(lvl);
            return (
              <label key={lvl} className={[styles.card, form.preferredLevel === lvl ? styles.selected : ''].filter(Boolean).join(' ')}>
                <input type="radio" name="preferredLevel" value={lvl} checked={form.preferredLevel === lvl} onChange={onChange} style={{ display: 'none' }} />
                <span>{cfg.emoji}</span>
                <span className={styles.cardLabel}>{cfg.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Voice Gender */}
      <div className={styles.field}>
        <label className={styles.label}>🎙️ Default Voice Gender</label>
        <p className={styles.fieldHint}>Used for Google TTS and browser voice fallback</p>
        <div className={styles.voiceGrid}>
          {GENDERS.map(g => (
            <label key={g.value} className={[styles.card, form.preferredVoice === g.value ? styles.selected : ''].filter(Boolean).join(' ')}>
              <input type="radio" name="preferredVoice" value={g.value} checked={form.preferredVoice === g.value} onChange={onChange} style={{ display: 'none' }} />
              <span style={{ fontSize: '26px' }}>{g.icon}</span>
              <span className={styles.cardLabel}>{g.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Accent */}
      <div className={styles.field}>
        <label className={styles.label}>🌍 Default Accent</label>
        <p className={styles.fieldHint}>Affects Google TTS voice and browser speech language</p>
        <div className={styles.accentGrid}>
          {ACCENTS.map(a => (
            <label key={a.value} className={[styles.accentCard, form.preferredAccent === a.value ? styles.selected : ''].filter(Boolean).join(' ')}>
              <input type="radio" name="preferredAccent" value={a.value} checked={form.preferredAccent === a.value} onChange={onChange} style={{ display: 'none' }} />
              <span className={styles.accentFlag}>{a.icon}</span>
              <span className={styles.cardLabel}>{a.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className={styles.actions}>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button onClick={onSave} loading={saving}>Save Changes</Button>
      </div>
    </div>
  );
}
