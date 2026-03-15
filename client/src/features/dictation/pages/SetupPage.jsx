import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import PageWrapper from "../../../components/layout/PageWrapper/PageWrapper";
import PassageSetup from "../components/PassageSetup/PassageSetup";
import DictationSettings from "../components/DictationSettings/DictationSettings";
import { useFetch } from "../../../hooks/useFetch";
import passageService from "../../../services/passageService";
import { ROUTES } from "../../../constants/routes";
import styles from "./SetupPage.module.css";

export default function SetupPage() {
  const navigate = useNavigate();
  const { data, loading } = useFetch(() => passageService.getAll());
  const passages = data?.passages || data || [];
  const [activeTab, setActiveTab] = useState("passages"); // 'passages' | 'settings'

  const handleStart = ({ passage, isHandwrite }) => {
    navigate(ROUTES.DICTATION, { state: { passage, isHandwrite } });
  };

  return (
    <PageWrapper>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Choose Your Practice</h1>
          <p className={styles.subtitle}>
            Select a passage, configure your classroom settings, then start
            dictating.
          </p>
        </div>
        <Link to={ROUTES.UPLOAD} className={styles.uploadLink}>
          📄 Upload Content
        </Link>
      </div>

      <div className={styles.tabs}>
        <button
          className={[
            styles.tab,
            activeTab === "passages" ? styles.tabActive : "",
          ]
            .filter(Boolean)
            .join(" ")}
          onClick={() => setActiveTab("passages")}
        >
          📚 Passages
        </button>
        <button
          className={[
            styles.tab,
            activeTab === "settings" ? styles.tabActive : "",
          ]
            .filter(Boolean)
            .join(" ")}
          onClick={() => setActiveTab("settings")}
        >
          🎓 Classroom Settings
        </button>
      </div>

      {activeTab === "passages" && (
        <PassageSetup
          passages={passages}
          loading={loading}
          onStart={handleStart}
        />
      )}
      {activeTab === "settings" && <DictationSettings />}
    </PageWrapper>
  );
}
