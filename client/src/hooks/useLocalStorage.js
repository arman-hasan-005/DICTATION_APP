import { useState } from 'react';
export const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try { const item = localStorage.getItem(key); return item ? JSON.parse(item) : initialValue; }
    catch { return initialValue; }
  });
  const setValue = (value) => {
    try {
      const v = value instanceof Function ? value(storedValue) : value;
      setStoredValue(v);
      if (v == null) localStorage.removeItem(key);
      else localStorage.setItem(key, JSON.stringify(v));
    } catch {}
  };
  return [storedValue, setValue];
};
