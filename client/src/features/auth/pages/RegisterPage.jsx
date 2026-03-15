import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import RegisterForm from '../components/RegisterForm/RegisterForm';
import { useAuth } from '../../../hooks/useAuth';
import { ROUTES } from '../../../constants/routes';
import { LEVELS } from '../../../constants/levels';
import styles from './AuthPage.module.css';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [fields,   setFields]   = useState({ name:'', email:'', password:'', preferredLevel: LEVELS.BEGINNER });
  const [errors,   setErrors]   = useState({});
  const [loading,  setLoading]  = useState(false);
  const [apiError, setApiError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFields(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
    setApiError('');
  };

  const validate = () => {
    const errs = {};
    if (!fields.name.trim())    errs.name     = 'Name is required';
    if (!fields.email.trim())   errs.email    = 'Email is required';
    if (fields.password.length < 6) errs.password = 'Password must be at least 6 characters';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await register(fields);
      navigate(ROUTES.DASHBOARD);
    } catch (err) {
      setApiError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logo}>🎙️</div>
          <h1 className={styles.title}>Create account</h1>
          <p className={styles.subtitle}>Start your dictation journey today</p>
        </div>
        <RegisterForm fields={fields} errors={errors} loading={loading} apiError={apiError} onChange={handleChange} onSubmit={handleSubmit} />
        <p className={styles.footer}>Already have an account? <Link to={ROUTES.LOGIN} className={styles.link}>Log in</Link></p>
      </div>
    </div>
  );
}
