'use client';
import { useState, FormEvent } from 'react';

export default function LoginPage() {
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<boolean>(false);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Substitua pela senha que deseja dar aos seus amigos
    if (password === 'caverna123') {
      document.cookie = "projeto_autorizado=true; path=/; max-age=604800; SameSite=Strict";
      window.location.href = '/';
    } else {
      setError(true);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif', background: '#f5f5f5', color: '#000' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '30px', border: '1px solid #ddd', borderRadius: '8px', background: '#fff', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <h2 style={{ margin: '0 0 10px 0' }}>Acesso Restrito</h2>
        <p style={{ margin: '0 0 15px 0', color: '#666' }}>Insira a senha para visualizar o projeto:</p>
        <input 
          type="password" 
          value={password} 
          onChange={(e) => { setPassword(e.target.value); setError(false); }} 
          placeholder="Senha"
          style={{ padding: '10px', fontSize: '16px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        {error && <p style={{ color: 'red', margin: '5px 0 0 0', fontSize: '14px' }}>Senha incorreta!</p>}
        <button type="submit" style={{ padding: '10px', background: '#000', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px' }}>
          Entrar
        </button>
      </form>
    </div>
  );
}
