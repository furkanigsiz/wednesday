import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export const hashPassword = async (password: string): Promise<string> => {
  try {
    if (!password) {
      throw new Error('Şifre boş olamaz');
    }
    return await bcrypt.hash(password, SALT_ROUNDS);
  } catch (error) {
    console.error('Şifre hash hatası:', error);
    throw error;
  }
};

export const comparePasswords = async (
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> => {
  try {
    if (!plainPassword || !hashedPassword) {
      throw new Error('Şifre veya hash boş olamaz');
    }
    return await bcrypt.compare(plainPassword, hashedPassword);
  } catch (error) {
    console.error('Şifre karşılaştırma hatası:', error);
    throw error;
  }
}; 