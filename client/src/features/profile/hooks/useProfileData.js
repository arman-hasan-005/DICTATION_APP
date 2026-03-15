import { useState } from 'react';
import { useAuth }  from '../../../hooks/useAuth';
import { useFetch } from '../../../hooks/useFetch';
import authService  from '../../../services/authService';

export const useProfileData = () => {
  const { user, updateUser } = useAuth();
  const { data, loading, refetch } = useFetch(() => authService.getProfile());

  const [editing,   setEditing]   = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [saveError, setSaveError] = useState('');
  const [activeTab, setActiveTab] = useState('profile');

  const [form, setForm] = useState({
    name:            user?.name            || '',
    preferredLevel:  user?.preferredLevel  || 'beginner',
    preferredVoice:  user?.preferredVoice  || 'female',
    preferredAccent: user?.preferredAccent || 'american',
  });

  const profileUser    = data?.user || user;
  const recentSessions = data?.recentSessions || [];

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleEditStart = () => {
    setForm({
      name:            profileUser?.name            || '',
      preferredLevel:  profileUser?.preferredLevel  || 'beginner',
      preferredVoice:  profileUser?.preferredVoice  || 'female',
      preferredAccent: profileUser?.preferredAccent || 'american',
    });
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    try {
      const res = await authService.updateProfile(form);
      updateUser(res.data.user);
      setEditing(false);
      refetch();
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  };

  return {
    profileUser, recentSessions, loading,
    editing, saving, saveError,
    form, handleFormChange, handleSave, handleEditStart, setEditing,
    activeTab, setActiveTab,
  };
};
