import { useNavigate } from "react-router-dom";
import PageWrapper from "../../../components/layout/PageWrapper/PageWrapper";
import DictationSettings from "../components/DictationSettings/DictationSettings";
import Button from "../../../components/ui/Button/Button";
import { ROUTES } from "../../../constants/routes";
import styles from "./SettingsPage.module.css";

export default function SettingsPage() {
  const navigate = useNavigate();

  return (
    <PageWrapper>
      {/* Header with back button */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Classroom Settings</h1>
          <p className={styles.subtitle}>
            Configure how the dictation teacher speaks — voice, speed, repeats
            and pauses.
          </p>
        </div>
      </div>

      {/* Full settings panel */}
      <DictationSettings />
      <br />

      {/* Done button — returns to Practice page */}
      <div className={styles.footer}>
        <Button size="lg" onClick={() => navigate(ROUTES.SETUP)}>
          ✅ Done — Back to Practice
        </Button>
      </div>
    </PageWrapper>
  );
}
