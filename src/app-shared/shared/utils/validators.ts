// AUTO-SINCRONIZADO desde ejoiFE a1e61e3d072b6cc9e8b074adda33480eb1d3a1f2@a1e61e3d072b6cc9e8b074adda33480eb1d3a1f2:src/shared/utils/validators.ts. No editar: npm run sync:app
/**
 * Utilidades de validación
 */

export const validators = {
  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
  
  required: (value: string | null | undefined): boolean => {
    return value !== null && value !== undefined && value.trim() !== '';
  },
  
  minLength: (value: string, min: number): boolean => {
    return value.length >= min;
  },
  
  maxLength: (value: string, max: number): boolean => {
    return value.length <= max;
  },
  
  password: (password: string): boolean => {
    // Mínimo 8 caracteres, al menos una letra y un número
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
    return passwordRegex.test(password);
  },

  /**
   * Valida que un nombre solo contenga letras (incluyendo acentos y caracteres internacionales)
   * No permite números, símbolos especiales, ni todo mayúsculas
   */
  name: (name: string): boolean => {
    if (!name || name.trim() === '') return false;
    if (name !== name.trim()) return false;
    if (/\s{2,}/.test(name)) return false;
    // Permite letras (incluyendo acentos, ñ, ü), espacios, guiones y apóstrofes
    // Caracteres válidos: letras unicode, espacios, guiones (-), apóstrofes (')
    const nameRegex = /^[\p{L}\s'-]+$/u;
    const isValidFormat = nameRegex.test(name);
    // También verificar que no esté todo en mayúsculas
    const lettersOnly = name.replace(/[^a-zA-ZÀ-ÿ]/g, '');
    const isAllUppercase = lettersOnly.length > 0 && lettersOnly === lettersOnly.toUpperCase();
    return isValidFormat && !isAllUppercase;
  },

  /**
   * Verifica si un nombre contiene números
   */
  nameHasNumbers: (name: string): boolean => {
    const numberRegex = /\d/;
    return numberRegex.test(name);
  },

  /**
   * Verifica si un nombre contiene símbolos no permitidos
   * (todo excepto letras, espacios, guiones y apóstrofes)
   */
  nameHasInvalidSymbols: (name: string): boolean => {
    // Si hay caracteres que no son letras, espacios, guiones o apóstrofes
    const invalidSymbolsRegex = /[^\p{L}\s'-]/u;
    return invalidSymbolsRegex.test(name);
  },

  /**
   * Verifica si un nombre está todo en mayúsculas
   */
  nameIsAllUppercase: (name: string): boolean => {
    // Obtener solo las letras del nombre
    const lettersOnly = name.replace(/[^a-zA-ZÀ-ÿ]/g, '');
    if (lettersOnly.length === 0) return false;
    // Verificar si todas las letras están en mayúsculas
    return lettersOnly === lettersOnly.toUpperCase();
  },

  /**
   * Obtiene un mensaje de error específico para la validación de nombre
   */
  getNameError: (name: string): string | null => {
    if (!name || name.trim() === '') {
      return null; // No mostrar error si está vacío
    }

    if (name !== name.trim()) {
      return 'El nombre no puede comenzar ni terminar con espacios';
    }

    if (/\s{2,}/.test(name)) {
      return 'El nombre no puede tener espacios consecutivos';
    }

    if (name.trim().length < 2) {
      return 'El nombre debe tener al menos 2 caracteres';
    }
    
    if (validators.nameHasNumbers(name)) {
      return 'El nombre no puede contener números';
    }
    
    if (validators.nameHasInvalidSymbols(name)) {
      return 'El nombre solo puede contener letras, espacios y guiones';
    }

    if (validators.nameIsAllUppercase(name)) {
      return 'El nombre no puede estar todo en mayúsculas';
    }
    
    return null;
  },
};

