import { Component } from 'react';
export default class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error('ErrorBoundary:', error, info); }
  render() {
    if (this.state.hasError) return (
      <div style={{ minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'16px',padding:'24px',textAlign:'center',background:'#F8FAFC' }}>
        <div style={{ fontSize:'56px' }}>💥</div>
        <h2 style={{ fontFamily:'var(--font-display)',fontSize:'24px',color:'#1E293B' }}>Something went wrong</h2>
        <p style={{ color:'#64748B',fontSize:'15px',maxWidth:'400px' }}>An unexpected error occurred. Please refresh the page.</p>
        <button onClick={() => window.location.reload()} style={{ padding:'10px 24px',background:'#4F46E5',color:'white',border:'none',borderRadius:'10px',cursor:'pointer',fontWeight:'600',fontSize:'15px' }}>Refresh Page</button>
      </div>
    );
    return this.props.children;
  }
}
