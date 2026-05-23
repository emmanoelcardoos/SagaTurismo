'use client';
import { useState } from 'react';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // ATENÇÃO: Substitua 'MinhaSenhaSegura123' pela senha que deseja dar aos seus amigos
    if (password === 'caverna123') {
      // Salva um cookie que dura 7 dias
      document.cookie = "projeto_autorizado=true; path=/; max-age=604800; SameSite=Strict";
      // Atualiza a página e o middleware vai permitir o acesso
      window.location.href = '/';
    } else {
      setError(true);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h2>Acesso Restrito</h2>
        <p>Insira a senha para visualizar o projeto:</p>
        <input 
          type="password" 
          value={password} 
          onChange={(e) => { setPassword(e.target.value); setError(false); }} 
          placeholder="Senha"
          style={{ padding: '8px', fontSize: '16px' }}
        />
        {error && <p style={{ color: 'red', margin: 0 }}>Senha incorreta!</p>}
        <button type="submit" style={{ padding: '8px', background: '#000', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Entrar
        </button>
      </form>
    </div>
  );
}
