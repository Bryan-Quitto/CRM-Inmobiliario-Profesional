export const translateAuthError = (errorMessage?: string | null): string => {
  if (!errorMessage) return 'Ocurrió un error inesperado. Por favor, intenta de nuevo.';

  const msg = errorMessage.toLowerCase();

  // Diccionario de mapeo de errores de Supabase GoTrue
  if (msg.includes('invalid login credentials')) {
    return 'Correo electrónico o contraseña incorrectos.';
  }
  if (msg.includes('password should be at least')) {
    return 'La contraseña debe tener al menos 6 caracteres.';
  }
  if (msg.includes('user already registered')) {
    return 'Este correo electrónico ya se encuentra registrado.';
  }
  if (msg.includes('token has expired or is invalid')) {
    return 'El enlace de seguridad ha expirado o es inválido.';
  }
  if (msg.includes('user not found')) {
    return 'No se encontró un usuario con este correo electrónico.';
  }
  if (msg.includes('new password should be different')) {
    return 'La nueva contraseña debe ser diferente a la contraseña anterior.';
  }
  if (msg.includes('rate limit')) {
    return 'Has excedido el límite de intentos. Por favor, espera unos minutos e intenta de nuevo.';
  }
  if (msg.includes('email not confirmed')) {
    return 'Debes confirmar tu correo electrónico antes de iniciar sesión.';
  }
  if (msg.includes('weak_password')) {
    return 'La contraseña es demasiado débil. Usa una combinación más segura.';
  }

  // Fallback para cualquier otro error en inglés o desconocido
  return 'Error de autenticación. Verifica tus datos e intenta de nuevo.';
};
