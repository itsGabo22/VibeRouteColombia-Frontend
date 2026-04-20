import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BulkImportModule } from './BulkImportModule';
import api from '../../shared/lib/api';

// Mockeamos la API para que no haga llamadas reales al backend durante los tests
vi.mock('../../shared/lib/api');

describe('BulkImportModule', () => {
  it('se renderiza correctamente y muestra el área de carga', () => {
    render(<BulkImportModule />);
    
    // Verificamos que los textos principales estén en pantalla
    expect(screen.getByText(/Importación de Flota/i)).toBeInTheDocument();
    expect(screen.getByText(/Arrastra tu archivo .json aquí para procesar/i)).toBeInTheDocument();
  });
});
