import { useState, useEffect } from 'react';

const MAX_ATTEMPTS = 3;
const MAX_LOCKOUT_MINUTES = 12 * 60; // 12 horas en minutos

const getLockoutTimeMs = (attempts: number) => {
  if (attempts < MAX_ATTEMPTS) return 0;
  
  // Fórmula: 2^(intentos - 3)
  // Ej: 3 intentos = 2^0 = 1 min
  // Ej: 4 intentos = 2^1 = 2 min
  // Ej: 5 intentos = 2^2 = 4 min
  const exponent = attempts - MAX_ATTEMPTS;
  const minutes = Math.min(MAX_LOCKOUT_MINUTES, Math.pow(2, exponent));
  
  return minutes * 60 * 1000;
};

const getInitialState = (key: string) => {
  const storedLock = localStorage.getItem(`lockout_${key}`);
  if (storedLock) {
    try {
      const { attempts, lockUntil } = JSON.parse(storedLock);
      
      if (lockUntil) {
        const now = Date.now();
        if (now < lockUntil) {
          return {
            attempts: attempts || 0,
            isLocked: true,
            timeRemaining: Math.ceil((lockUntil - now) / 1000)
          };
        }
        // Si el bloqueo expiró, MANTENEMOS los intentos, solo quitamos el candado
        localStorage.setItem(`lockout_${key}`, JSON.stringify({ attempts: attempts || 0, lockUntil: null }));
        return { attempts: attempts || 0, isLocked: false, timeRemaining: 0 };
      }
      
      return { attempts: attempts || 0, isLocked: false, timeRemaining: 0 };
    } catch {
      localStorage.removeItem(`lockout_${key}`);
    }
  }
  return { attempts: 0, isLocked: false, timeRemaining: 0 };
};

const formatTime = (seconds: number) => {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const remainingM = m % 60;
    return remainingM > 0 ? `${h}h ${remainingM}m` : `${h}h`;
  }
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
};

export const usePasswordLockout = (lockKey: string) => {
  const initialState = getInitialState(lockKey);
  const [attempts, setAttempts] = useState(initialState.attempts);
  const [isLocked, setIsLocked] = useState(initialState.isLocked);
  const [lockoutTimeRemaining, setLockoutTimeRemaining] = useState(initialState.timeRemaining);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLocked && lockoutTimeRemaining > 0) {
      timer = setInterval(() => {
        setLockoutTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsLocked(false);
            
            // Cuando expira el tiempo, actualizamos el localStorage para quitar el lockUntil
            // PERO no reseteamos los attempts, para que el próximo fallo active el multiplicador
            const storedLock = localStorage.getItem(`lockout_${lockKey}`);
            if (storedLock) {
              try {
                const parsed = JSON.parse(storedLock);
                localStorage.setItem(`lockout_${lockKey}`, JSON.stringify({ attempts: parsed.attempts, lockUntil: null }));
              } catch (err) {
                console.error('Error parsing lockout state:', err);
              }
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isLocked, lockoutTimeRemaining, lockKey]);

  const registerFailedAttempt = () => {
    const newAttempts = attempts + 1;
    if (newAttempts >= MAX_ATTEMPTS) {
      const lockoutTimeMs = getLockoutTimeMs(newAttempts);
      const lockUntil = Date.now() + lockoutTimeMs;
      
      setIsLocked(true);
      setAttempts(newAttempts);
      setLockoutTimeRemaining(Math.ceil(lockoutTimeMs / 1000));
      
      localStorage.setItem(`lockout_${lockKey}`, JSON.stringify({ attempts: newAttempts, lockUntil }));
    } else {
      setAttempts(newAttempts);
      localStorage.setItem(`lockout_${lockKey}`, JSON.stringify({ attempts: newAttempts, lockUntil: null }));
    }
  };

  const registerSuccessfulAttempt = () => {
    setAttempts(0);
    setIsLocked(false);
    localStorage.removeItem(`lockout_${lockKey}`);
  };

  return {
    isLocked,
    lockoutTimeRemaining,
    formattedLockoutTime: formatTime(lockoutTimeRemaining),
    registerFailedAttempt,
    registerSuccessfulAttempt,
    attemptsRemaining: Math.max(0, MAX_ATTEMPTS - attempts)
  };
};
