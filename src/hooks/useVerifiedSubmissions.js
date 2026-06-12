import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';

export function useVerifiedSubmissions(enabled) {
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    if (!enabled) { setSubmissions([]); return; }

    supabase.from('submissions').select('*').eq('status', 'verified')
      .then(({ data, error }) => {
        console.log('[community] fetch count:', data?.length, '| error:', error?.message ?? null);
        if (data) setSubmissions(data);
      });

    const channel = supabase.channel('community-layer')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'submissions' },
        (payload) => {
          console.log('[community] realtime event:', payload.eventType, payload.new);
          const { eventType, new: row, old: oldRow } = payload;
          if (eventType === 'DELETE') {
            setSubmissions(prev => prev.filter(s => s.id !== oldRow.id));
            return;
          }
          if (row.status === 'verified') {
            setSubmissions(prev => {
              const exists = prev.find(s => s.id === row.id);
              return exists ? prev.map(s => s.id === row.id ? row : s) : [...prev, row];
            });
          } else {
            setSubmissions(prev => prev.filter(s => s.id !== row.id));
          }
        })
      .subscribe(status => console.log('[community] channel status:', status));

    return () => { supabase.removeChannel(channel); };
  }, [enabled]);

  const geojson = useMemo(() => ({
    type: 'FeatureCollection',
    features: submissions.map(s => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [s.longitude, s.latitude] },
      properties: { ...s },
    })),
  }), [submissions]);

  return { geojson, submissions };
}
