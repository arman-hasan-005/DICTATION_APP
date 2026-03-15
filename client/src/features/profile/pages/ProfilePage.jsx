import PageWrapper from "../../../components/layout/PageWrapper/PageWrapper";
import ProfileCard from "../components/ProfileCard/ProfileCard";
import EditProfileForm from "../components/EditProfileForm/EditProfileForm";
import BadgesCollection from "../components/BadgesCollection/BadgesCollection";
import RecentSessions from "../../dashboard/components/RecentSessions/RecentSessions";
import DictationSettings from "../../dictation/components/DictationSettings/DictationSettings";
import Loader from "../../../components/ui/Loader/Loader";
import { useProfileData } from "../hooks/useProfileData";
import styles from "./ProfilePage.module.css";

const TABS = [
  { id: "profile", label: "👤 Profile" },
  { id: "settings", label: "🎓 Classroom Settings" },
  { id: "badges", label: "🏅 Badges" },
  { id: "sessions", label: "📝 Recent Sessions" },
];

export default function ProfilePage() {
  const {
    profileUser,
    recentSessions,
    loading,
    editing,
    saving,
    saveError,
    form,
    handleFormChange,
    handleSave,
    handleEditStart,
    setEditing,
    activeTab,
    setActiveTab,
  } = useProfileData();

  if (loading) return <Loader fullPage text="Loading profile…" />;

  return (
    <PageWrapper>
      <h1 className={styles.title}>My Profile</h1>

      <div className={styles.tabs}>
        {TABS.map((t) => (
          <button
            key={t.id}
            className={[styles.tab, activeTab === t.id ? styles.tabActive : ""]
              .filter(Boolean)
              .join(" ")}
            onClick={() => setActiveTab(t.id)}
            type="button"
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "profile" &&
        (editing ? (
          <EditProfileForm
            form={form}
            saving={saving}
            saveError={saveError}
            onChange={handleFormChange}
            onSave={handleSave}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <ProfileCard user={profileUser} onEdit={handleEditStart} />
        ))}

      {activeTab === "settings" && <DictationSettings />}

      {activeTab === "badges" && (
        <BadgesCollection earnedBadges={profileUser?.badges || []} />
      )}

      {activeTab === "sessions" && (
        <RecentSessions sessions={recentSessions} loading={false} />
      )}
    </PageWrapper>
  );
}
