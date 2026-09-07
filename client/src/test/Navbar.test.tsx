import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import * as AuthContextModule from '../context/AuthContext';

describe('Navbar Component - Scoped Landing Page Dark Theme vs Standard Pages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dark styling and omits "Get Started" on the Landing Page ("/")', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <Navbar />
      </MemoryRouter>
    );

    // Header has landing page dark background
    const header = container.querySelector('header');
    expect(header?.className).toContain('bg-[#090d16]');

    // Contains Log In link
    expect(screen.getByRole('link', { name: /log in/i })).toBeInTheDocument();

    // Does NOT contain "Get Started" button in Navbar on landing page
    expect(screen.queryByRole('link', { name: /get started/i })).not.toBeInTheDocument();
  });

  it('renders standard light styling and includes "Get Started" button on other pages (e.g. "/login")', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    const { container } = render(
      <MemoryRouter initialEntries={['/login']}>
        <Navbar />
      </MemoryRouter>
    );

    // Header has standard light background
    const header = container.querySelector('header');
    expect(header?.className).toContain('bg-[#F8FAFE]');

    // Contains BOTH Log In and Get Started
    expect(screen.getByRole('link', { name: /log in/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /get started/i })).toBeInTheDocument();
  });

  it('renders standard light styling for authenticated users on "/dashboard"', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: { _id: '1', name: 'John Doe', email: 'john@example.com' },
      accessToken: 'token-xyz',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    const { container } = render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Navbar />
      </MemoryRouter>
    );

    const header = container.querySelector('header');
    expect(header?.className).toContain('bg-[#F8FAFE]');
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log out/i })).toBeInTheDocument();
  });
});
