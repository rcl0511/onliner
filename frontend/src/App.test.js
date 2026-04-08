import authStorage from './services/authStorage';

describe('authStorage', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  test('moves a stored local user into session storage on read', () => {
    const legacyUser = { name: '테스트 사용자', role: 'vendor' };
    localStorage.setItem('userInfo', JSON.stringify(legacyUser));

    expect(authStorage.getUser()).toEqual(legacyUser);
    expect(JSON.parse(sessionStorage.getItem('userInfo'))).toEqual(legacyUser);
    expect(localStorage.getItem('userInfo')).toBeNull();
  });

  test('moves a stored local token into session storage on read', () => {
    localStorage.setItem('authToken', 'legacy-token');

    expect(authStorage.getToken()).toBe('legacy-token');
    expect(sessionStorage.getItem('authToken')).toBe('legacy-token');
    expect(localStorage.getItem('authToken')).toBeNull();
  });

  test('clears both user and token state', () => {
    authStorage.setUser({ name: '홍길동' });
    authStorage.setToken('token-value');

    authStorage.clearUser();

    expect(authStorage.getUser()).toEqual({});
    expect(authStorage.getToken()).toBe('');
  });

  test('clearUser also removes a legacy token stored in localStorage', () => {
    localStorage.setItem('authToken', 'legacy-token');

    authStorage.clearUser();

    expect(localStorage.getItem('authToken')).toBeNull();
    expect(authStorage.getToken()).toBe('');
  });
});
