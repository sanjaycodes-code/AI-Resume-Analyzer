import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import * as AuthContextModule from '../context/AuthContext';

describe('MainLayout Component - Footer Dark Theme Isolation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });
  });

  it('renders dark themed footer on the Landing Page ("/")', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <MainLayout>
          <div>Landing Page Content</div>
        </MainLayout>
      </MemoryRouter>
    );

    const footer = container.querySelector('footer');
    expect(footer).toBeInTheDocument();
    expect(footer?.className).toContain('bg-[#090d16]');
    expect(footer?.className).toContain('border-white/10');
    expect(footer?.className).not.toContain('bg-white');

    const textDiv = footer?.querySelector('div');
    expect(textDiv?.className).toContain('text-slate-400');
    expect(textDiv?.className).not.toContain('text-slate-500');

    expect(
      screen.getByText(/AI Resume Analyzer\. Built for intelligent career optimization\./i)
    ).toBeInTheDocument();
  });

  it('renders standard light footer on non-landing pages (e.g. "/login")', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/login']}>
        <MainLayout>
          <div>Login Page Content</div>
        </MainLayout>
      </MemoryRouter>
    );

    const footer = container.querySelector('footer');
    expect(footer).toBeInTheDocument();
    expect(footer?.className).toContain('bg-white');
    expect(footer?.className).toContain('border-slate-200');
    expect(footer?.className).not.toContain('bg-[#090d16]');

    const textDiv = footer?.querySelector('div');
    expect(textDiv?.className).toContain('text-slate-500');
    expect(textDiv?.className).not.toContain('text-slate-400');

    expect(
      screen.getByText(/AI Resume Analyzer\. Built for intelligent career optimization\./i)
    ).toBeInTheDocument();
  });

  it('renders standard light footer for authenticated dashboard route ("/dashboard")', () => {
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
        <MainLayout>
          <div>Dashboard Content</div>
        </MainLayout>
      </MemoryRouter>
    );

    const footer = container.querySelector('footer');
    expect(footer).toBeInTheDocument();
    expect(footer?.className).toContain('bg-white');
    expect(footer?.className).toContain('border-slate-200');
    expect(footer?.className).not.toContain('bg-[#090d16]');

    const textDiv = footer?.querySelector('div');
    expect(textDiv?.className).toContain('text-slate-500');
  });
});
