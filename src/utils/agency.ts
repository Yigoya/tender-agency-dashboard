export const getAgencyIdFromStorage = (): number | null => {
  if (typeof window === 'undefined') return null;

  const storedProfile = localStorage.getItem('agencyProfile');
  if (storedProfile) {
    try {
      const parsed = JSON.parse(storedProfile);
      const candidate = parsed?.id ?? parsed?.agencyId;
      const parsedId = Number(candidate);
      if (!Number.isNaN(parsedId)) return parsedId;
    } catch {
      // ignore JSON parse errors and try the fallback
    }
  }

  const storedId = localStorage.getItem('agencyId');
  const parsedId = storedId ? Number(storedId) : NaN;
  return Number.isNaN(parsedId) ? null : parsedId;
};
