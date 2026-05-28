# Login — contraseña y validación en tiempo real

Mejoras del formulario en `src/ui/pages/LoginPage.tsx`.

## Visibilidad de contraseña

- Iconos compartidos: `src/shared/components/password/PasswordVisibilityIcons.tsx`
  - `IconPasswordHidden` — contraseña oculta (mostrar al pulsar)
  - `IconPasswordVisible` — contraseña visible (ocultar al pulsar)
- Estado: `showPassword` (login) y `showNewPassword` (recuperación)
- El `input` alterna entre `type="password"` y `type="text"`

## Criterios de seguridad

- Panel: `src/shared/components/password/PasswordCriteriaChecklist.tsx`
- Reglas (`src/shared/lib/passwordValidation.ts`):
  - Mínimo 8 caracteres
  - Al menos una letra mayúscula (`/[A-Z]/`)
- El panel aparece al escribir en el campo de contraseña (login o nueva contraseña en modo reset)
- Criterio cumplido: texto e icono en verde con `Check`
- Criterio pendiente: texto en rojo suave e icono `Circle`

## Rama de trabajo

`Feat/login-password-improvements`
