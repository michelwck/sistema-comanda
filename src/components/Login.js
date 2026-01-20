export function Login() {
  return `
    <div style="
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 2rem;
      z-index: 9999;
    ">
      <div style="
        background: white;
        border-radius: 20px;
        padding: 4rem 3rem;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        text-align: center;
        max-width: 450px;
        width: 100%;
      ">
        <!-- Logo -->
        <div style="
          width: 100px;
          height: 100px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 2rem;
          box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
        ">
          <span style="font-size: 3.5rem;">🍺</span>
        </div>
        
        <!-- Title -->
        <h1 style="
          font-size: 2.5rem;
          font-weight: 700;
          color: #1a202c;
          margin-bottom: 0.75rem;
        ">BarComanda</h1>
        
        <p style="
          color: #718096;
          margin-bottom: 3rem;
          font-size: 1rem;
        ">Sistema de Gerenciamento de Comandas</p>
        
        <!-- Google Button -->
        <button 
          id="google-login-btn"
          style="
            width: 100%;
            padding: 1.25rem;
            background: white;
            border: 2px solid #e2e8f0;
            border-radius: 12px;
            font-size: 1.1rem;
            font-weight: 600;
            color: #1a202c;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 1rem;
          "
        >
          <svg width="24" height="24" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Entrar com Google
        </button>
        
        <!-- Footer -->
        <p style="
          margin-top: 2.5rem;
          font-size: 0.9rem;
          color: #a0aec0;
        ">
          Apenas usuários autorizados podem acessar o sistema
        </p>
      </div>
    </div>
  `;
}
