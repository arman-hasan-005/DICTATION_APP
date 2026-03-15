import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { ROUTES } from '../../../constants/routes';

export const useLoginForm = () => {
  const { login }  = useAuth();
  const navigate   = useNavigate();
  const [fields,   setFields]   = useState({ email: '', password: '' });
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
    if (!fields.email.trim())    errs.email    = 'Email is required';
    if (!fields.password)        errs.password = 'Password is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await login(fields.email, fields.password);
      navigate(ROUTES.DASHBOARD);
    } catch (err) {
      setApiError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return { fields, errors, loading, apiError, handleChange, handleSubmit };
};
