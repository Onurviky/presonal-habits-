import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import styles from './Auth.module.css';

export default function Login({ onSwitchToRegister }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(getErrorMessage(err.code));
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logo}>⬡</div>
        <h1 className={styles.title}>Life Tracker</h1>
        <p className={styles.subtitle}>Iniciá sesión para continuar</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.field}>
            <label className={styles.label}>Email</label>
            <input
              type="email"
              className={styles.input}
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              autoFocus
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Contraseña</label>
            <input
              type="password"
              className={styles.input}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className={styles.btn} disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <p className={styles.switchText}>
          ¿No tenés cuenta?{' '}
          <button className={styles.switchBtn} onClick={onSwitchToRegister} type="button">
            Registrate
          </button>
        </p>
      </div>
    </div>
  );
}

function getErrorMessage(code) {
  switch (code) {
    case 'auth/user-not-found': return 'No existe una cuenta con ese email.';
    case 'auth/wrong-password': return 'Contraseña incorrecta.';
    case 'auth/invalid-email': return 'El email no es válido.';
    case 'auth/invalid-credential': return 'Email o contraseña incorrectos.';
    case 'auth/too-many-requests': return 'Demasiados intentos fallidos. Intentá más tarde.';
    default: return 'Error al iniciar sesión. Intentá de nuevo.';
  }
}
