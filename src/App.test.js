import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

test('renders app header and default home page', () => {
  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>
  );
  expect(screen.getByText('FinMe')).toBeInTheDocument();
  expect(screen.getAllByText('Home').length).toBeGreaterThan(0);
  expect(screen.getAllByText('Analysis').length).toBeGreaterThan(0);
  expect(screen.getByText(/Institutional-Grade Stock Analysis/i)).toBeInTheDocument();
});


