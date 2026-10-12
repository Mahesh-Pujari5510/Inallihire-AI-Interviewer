import { render, screen, waitFor } from '@testing-library/react';
import App from './App';

jest.mock('./resumeAnalyzer/extraction', () => ({ extractResumeText: jest.fn() }));

test('renders the protected authentication experience when no session exists', async () => {
  global.fetch = jest.fn().mockRejectedValue(new Error('not signed in'));
  render(<App />);
  await waitFor(() => expect(screen.getByText(/Practice smarter/i)).toBeInTheDocument());
  expect(screen.getByRole('button', { name: /Sign in/i })).toBeInTheDocument();
});
