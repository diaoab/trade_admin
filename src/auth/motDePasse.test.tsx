import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { erreurMotDePasse, REGLE_MDP } from '@/lib/motDePasse';
import { nomCompte } from '@/api/types';
import { api } from '@/api/client';
import MotDePasseOubliePage from './MotDePasseOubliePage';

vi.mock('@/api/client', () => ({ api: { post: vi.fn(async () => null) } }));

describe('erreurMotDePasse', () => {
  it('applique la règle de l’API pour un administrateur', () => {
    expect(erreurMotDePasse('Court1')).toBe(REGLE_MDP);
    expect(erreurMotDePasse('sansmajuscule1')).toBe(REGLE_MDP);
    expect(erreurMotDePasse('SansChiffre')).toBe(REGLE_MDP);
    expect(erreurMotDePasse('Correct2026')).toBeNull();
  });

  it('vérifie la confirmation quand elle est donnée', () => {
    expect(erreurMotDePasse('Correct2026', 'Autre2026')).toContain('ne correspondent pas');
    expect(erreurMotDePasse('Correct2026', 'Correct2026')).toBeNull();
  });
});

describe('nomCompte', () => {
  it('affiche prénom et nom, sinon l’e-mail', () => {
    expect(nomCompte({ email: 'a@b.sn', first_name: 'Awa', last_name: 'Diop' })).toBe('Awa Diop');
    expect(nomCompte({ email: 'a@b.sn', first_name: null, last_name: 'Diop' })).toBe('Diop');
    expect(nomCompte({ email: 'a@b.sn', first_name: null, last_name: null })).toBe('a@b.sn');
  });
});

describe('MotDePasseOubliePage', () => {
  afterEach(cleanup);

  it('enchaîne e-mail, code et nouveau mot de passe, puis renvoie à la connexion', async () => {
    render(
      <MemoryRouter initialEntries={['/mot-de-passe-oublie']}>
        <Routes>
          <Route path="/mot-de-passe-oublie" element={<MotDePasseOubliePage />} />
          <Route path="/login" element={<p>page de connexion</p>} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: ' admin@example.com ' } });
    fireEvent.click(screen.getByText('Recevoir un code'));
    await screen.findByLabelText('Code');
    expect(api.post).toHaveBeenCalledWith('/auth/forgot-password', { email: 'admin@example.com' });

    // Seuls les chiffres sont gardés
    fireEvent.change(screen.getByLabelText('Code'), { target: { value: '12a3456' } });
    fireEvent.click(screen.getByText('Continuer'));
    await screen.findByLabelText('Nouveau mot de passe');
    expect(api.post).toHaveBeenCalledWith('/auth/verify-reset-code', { email: 'admin@example.com', code: '123456' });

    // Un mot de passe trop faible n'est pas envoyé
    fireEvent.change(screen.getByLabelText('Nouveau mot de passe'), { target: { value: 'faible' } });
    fireEvent.change(screen.getByLabelText('Confirmation'), { target: { value: 'faible' } });
    fireEvent.click(screen.getByText('Changer le mot de passe'));
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(api.post).toHaveBeenCalledTimes(2);

    fireEvent.change(screen.getByLabelText('Nouveau mot de passe'), { target: { value: 'Nouveau2026' } });
    fireEvent.change(screen.getByLabelText('Confirmation'), { target: { value: 'Nouveau2026' } });
    fireEvent.click(screen.getByText('Changer le mot de passe'));
    await waitFor(() => expect(screen.getByText('page de connexion')).toBeTruthy());
    expect(api.post).toHaveBeenLastCalledWith('/auth/reset-password', {
      email: 'admin@example.com',
      code: '123456',
      new_password: 'Nouveau2026',
    });
  });
});
