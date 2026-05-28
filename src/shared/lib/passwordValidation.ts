export const PASSWORD_MIN_LENGTH = 8;

export const hasMinLength = (password: string): boolean =>
  password.length >= PASSWORD_MIN_LENGTH;

export const hasUppercase = (password: string): boolean =>
  /[A-Z]/.test(password);

export type PasswordCriteriaKey = 'minLength' | 'uppercase';

export interface PasswordCriteriaResult {
  minLength: boolean;
  uppercase: boolean;
}

export const evaluatePasswordCriteria = (password: string): PasswordCriteriaResult => ({
  minLength: hasMinLength(password),
  uppercase: hasUppercase(password),
});
