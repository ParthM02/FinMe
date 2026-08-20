import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

test('renders app header', () => {
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>
  );
  expect(screen.getByText('FinMe')).toBeInTheDocument();
  expect(screen.getByText('Analysis')).toBeInTheDocument();
});

