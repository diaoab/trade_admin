import { describe, expect, it } from 'vitest';
import { montant, score } from './format';
import { politiqueSecurite } from './csp';
import { versPagination } from '@/api/types';

describe('politiqueSecurite', () => {
  it('autorise l’origine de l’API et elle seule en plus du site', () => {
    const csp = politiqueSecurite('https://api.exemple.com/trade/v1');
    expect(csp).toContain("connect-src 'self' https://api.exemple.com;");
    expect(csp).toContain("script-src 'self';");
    expect(csp).not.toContain("'unsafe-eval'");
  });

  it('reste en même origine quand l’API est relayée sous /api', () => {
    expect(politiqueSecurite('/api')).toContain("connect-src 'self';");
    expect(politiqueSecurite(undefined)).toContain("connect-src 'self';");
  });
});

describe('format', () => {
  it('formate le franc CFA sans décimales', () => {
    expect(montant(5000).replace(/\s/g, ' ')).toBe('5 000 FCFA');
    expect(montant(null)).toBe('—');
  });

  it('affiche un score avec deux décimales', () => {
    expect(score(0.5034)).toBe('0,50');
    expect(score(null)).toBe('—');
  });
});

describe('versPagination', () => {
  it('traduit la pagination de l’API pour le composant', () => {
    expect(versPagination({ total: 41, page: 2, limit: 20, pages: 3 })).toEqual({
      totalItems: 41, totalPages: 3, currentPage: 2, pageSize: 20,
    });
  });
});
