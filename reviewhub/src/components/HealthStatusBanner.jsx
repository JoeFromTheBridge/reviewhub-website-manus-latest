// src/components/HealthStatusBanner.jsx
import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, X } from 'lucide-react';
// Adjust this import if your api service lives in a different path
import api from '@/services/api';

const REFRESH_INTERVAL_MS = 60_000; // 60 seconds

function formatTimestamp(date) {
  if (!date) return '';
  try {
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export default function HealthStatusBanner({ className = '' }) {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchHealth = async () => {
      try {
        if (!isMounted) return;
        setLoading(true);
        setError(null);

        // This assumes you'll add api.getHealthStatus() in src/services/api.js
        const data = await api.getHealthStatus();
        if (!isMounted) return;

        setHealth(data || null);
        setLastChecked(new Date());
      } catch (err) {
        console.error('Failed to fetch health status', err);
        if (!isMounted) return;
        setError('Unable to reach backend API');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchHealth();
    const intervalId = setInterval(fetchHealth, REFRESH_INTERVAL_MS);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  if (hidden) {
    return null;
  }

  const isHealthy = !error && health && health.status === 'ok';
  const isDegraded = !error && health && health.status && health.status !== 'ok';

  let containerClasses =
    'w-full border px-4 py-3 rounded-md text-sm flex items-start gap-3 mb-4';
  let icon = null;
  let title = '';
  let message = '';

  if (loading && !health && !error) {
    containerClasses += ' bg-sky-50 border-sky-200 text-sky-900';
    icon = <Loader2 className="h-4 w-4 animate-spin mt-0.5" />;
    title = 'Checking system health…';
    message = 'Contacting the backend API to verify status.';
  } else if (error) {
    containerClasses += ' bg-red-50 border-red-200 text-red-900';
    icon = <AlertTriangle className="h-4 w-4 mt-0.5" />;
    title = 'Backend unreachable';
    message =
      'The frontend could not reach the API. Check Render, Vercel config, or your network connection.';
  } else if (isHealthy) {
    containerClasses += ' bg-emerald-50 border-emerald-200 text-emerald-900';
    icon = <CheckCircle2 className="h-4 w-4 mt-0.5" />;
    title = 'All systems operational';
    message = 'Backend health check is reporting status OK.';
  } else if (isDegraded) {
    containerClasses += ' bg-amber-50 border-amber-200 text-amber-900';
    icon = <AlertTriangle className="h-4 w-4 mt-0.5" />;
    title = 'Degraded health status';
    message =
      'The backend health endpoint is responding but not reporting a fully healthy state.';
  } else {
    // Fallback if we got some unexpected shape
    containerClasses += ' bg-amber-50 border-amber-200 text-amber-900';
    icon = <AlertTriangle className="h-4 w-4 mt-0.5" />;
    title = 'Unknown health status';
    message =
      'The health endpoint returned an unexpected response. Check logs for more details.';
  }

  const environment = health?.environment || 'unknown';
  const revisionShort = health?.revision ? health.revision.slice(0, 7) : null;
  const timestamp = health?.timestamp || null;
  const lastCheckedLabel = formatTimestamp(lastChecked);

  return (
    <div className={`${containerClasses} ${className}`}>
      <div className="mt-0.5">{icon}</div>

      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium">{title}</p>
          {environment && (
            <span className="inline-flex items-center rounded-full bg-black/5 px-2 py-0.5 text-xs font-medium uppercase tracking-wide">
              env: {environment}
            </span>
          )}
          {revisionShort && (
            <span className="inline-flex items-center rounded-full bg-black/5 px-2 py-0.5 text-xs font-mono">
              rev: {revisionShort}
            </span>
          )}
        </div>

        <p className="mt-1 text-xs sm:text-sm">{message}</p>

        <div className="mt-1 flex flex-wrap gap-3 text-[11px] sm:text-xs text-black/70">
          {timestamp && (
            <span>Reported at: {timestamp}</span>
          )}
          {lastCheckedLabel && (
            <span>Last checked: {lastCheckedLabel}</span>
          )}
          {!loading && (
            <button
              type="button"
              onClick={async () => {
                try {
                  setLoading(true);
                  setError(null);
                  const data = await api.getHealthStatus();
                  setHealth(data || null);
                  setLastChecked(new Date());
                } catch (err) {
                  console.error('Manual health refresh failed', err);
                  setError('Unable to reach backend API');
                } finally {
                  setLoading(false);
                }
              }}
              className="inline-flex items-center gap-1 rounded border border-black/10 px-2 py-0.5 text-[11px] font-medium hover:bg-black/5 transition"
            >
              {loading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <span className="h-1 w-1 rounded-full bg-green-500" />
              )}
              Refresh
            </button>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setHidden(true)}
        className="ml-2 mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full hover:bg-black/10 text-black/60"
        aria-label="Hide health status banner"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
