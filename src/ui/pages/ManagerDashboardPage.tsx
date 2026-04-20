import React from 'react';
import { AdminDashboardPage } from './AdminDashboardPage';

/**
 * Redirección forzada al Dashboard Unificado de Flota para logística.
 * Esto asegura que la vista antigua de "ManagerLocal" sea reemplazada
 * totalmente por la nueva interfaz premium de Fleet Management.
 */
export const ManagerDashboardPage: React.FC = () => {
  return <AdminDashboardPage />;
};

export default ManagerDashboardPage;
