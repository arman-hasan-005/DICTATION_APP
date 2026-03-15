// Exact original grade thresholds from Results.jsx
export const getGrade = (pct) => {
  if (pct >= 95) return { label:'A+', color:'#059669', bgColor:'#ECFDF5', message:'Outstanding! 🌟' };
  if (pct >= 85) return { label:'A',  color:'#059669', bgColor:'#ECFDF5', message:'Excellent! 🎉' };
  if (pct >= 75) return { label:'B',  color:'#2563EB', bgColor:'#EFF6FF', message:'Great job! 👏' };
  if (pct >= 65) return { label:'C',  color:'#D97706', bgColor:'#FFFBEB', message:'Good effort! 💪' };
  if (pct >= 50) return { label:'D',  color:'#EA580C', bgColor:'#FFF7ED', message:'Keep practicing! 📚' };
  return           { label:'F',  color:'#DC2626', bgColor:'#FEF2F2', message:"Don't give up! 🔄" };
};

export const getScoreColor = (pct) => {
  if (pct >= 80) return '#059669';
  if (pct >= 50) return '#D97706';
  return '#DC2626';
};

export const getScoreBg = (pct) => {
  if (pct >= 80) return '#ECFDF5';
  if (pct >= 50) return '#FFFBEB';
  return '#FEF2F2';
};
