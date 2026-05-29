import type { LucideProps } from 'lucide-react';
import { Eye, EyeOff } from 'lucide-react';

const DEFAULT_SIZE = 20;

type PasswordVisibilityIconProps = Omit<LucideProps, 'ref'>;

/** Contraseña oculta: pulsar para mostrar */
export const IconPasswordHidden = ({
  size = DEFAULT_SIZE,
  ...props
}: PasswordVisibilityIconProps) => (
  <Eye size={size} aria-hidden {...props} />
);

/** Contraseña visible: pulsar para ocultar */
export const IconPasswordVisible = ({
  size = DEFAULT_SIZE,
  ...props
}: PasswordVisibilityIconProps) => (
  <EyeOff size={size} aria-hidden {...props} />
);