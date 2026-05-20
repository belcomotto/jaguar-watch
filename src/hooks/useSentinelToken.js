import { useState, useEffect, useRef } from 'react';

const TOKEN_URL = 'https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token';

export function useSentinelToken() {
  const [token, setToken] = useState(null);
  const [status, setStatus] = useState('connecting'); // 'connecting' | 'ready' | 'error'
  const timerRef = useRef(null);

  const fetchToken = async () => {
    try {
      setStatus('connecting');
      const body = new URLSearchParams({
        client_id: 'cdse-public',
        grant_type: 'password',
        username: 'Belencomotto@me.com',
        password: 'Monito130901Be.',
      });
      const res = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      setToken(data.access_token);
      setStatus('ready');
      // Refresh 90s before expiry
      timerRef.current = setTimeout(fetchToken, (data.expires_in - 90) * 1000);
    } catch (e) {
      setStatus('error');
    }
  };

  useEffect(() => {
    fetchToken();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  return { token, status };
}
