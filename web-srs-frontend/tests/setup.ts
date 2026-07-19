import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Garante a desmontagem da árvore React após cada teste para evitar vazamento de memória e poluição de estado
afterEach(() => {
  cleanup();
});