export const formatNumber = (n: unknown): string => {
  const v = Number(n);
  return Number.isFinite(v) ? v.toLocaleString() : '0';
};

export const formatPercent = (n: unknown): string => {
  const v = Number(n);
  return Number.isFinite(v) ? v.toFixed(1) + '%' : '—';
};

export const formatCurrency = (n: unknown): string => {
  const v = Number(n);
  return Number.isFinite(v) ? '$' + v.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : '$0';
};

export const formatDate = (d: unknown): string => {
  if (!d) return '—';
  const date = new Date(d as string);
  return isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const timeAgo = (d: unknown): string => {
  if (!d) return '—';
  const date = new Date(d as string);
  if (isNaN(date.getTime())) return '—';
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s / 60) + ' min ago';
  if (s < 86400) return Math.floor(s / 3600) + ' hours ago';
  if (s < 172800) return 'Yesterday';
  if (s < 604800) return Math.floor(s / 86400) + ' days ago';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

/** Comprehensive formatting utilities */
export const fmt = {
  num: (v: unknown, fallback = '0'): string => {
    const n = Number(v);
    if (!Number.isFinite(n)) return fallback;
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return n.toLocaleString();
    return String(n);
  },
  pct: (v: unknown): string => {
    const n = Number(v);
    return Number.isFinite(n) ? n.toFixed(1) + '%' : '—';
  },
  money: (v: unknown): string => {
    const n = Number(v);
    if (!Number.isFinite(n)) return '$0';
    return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  },
  roas: (v: unknown): string => {
    const n = Number(v);
    if (!Number.isFinite(n) || n === 0) return '—';
    return n.toFixed(1) + 'x';
  },
  ago: timeAgo,
  status: (s: string): string => {
    const map: Record<string, string> = {
      pending_approval: 'Needs Review',
      'pending approval': 'Needs Review',
      pending: 'Pending',
      approved: 'Approved',
      published: 'Published',
      failed: 'Failed',
      draft: 'Draft',
      active: 'Active',
      paused: 'Paused',
      rejected: 'Rejected',
    };
    return map[s] || s?.replace(/_/g, ' ')?.replace(/\b\w/g, l => l.toUpperCase()) || '—';
  },
  score: (v: unknown): string => {
    const n = Number(v);
    return Number.isFinite(n) ? n + '/100' : '0/100';
  },
  name: (contact: Record<string, unknown>): string => {
    if (contact?.first_name || contact?.last_name)
      return [contact.first_name, contact.last_name].filter(Boolean).join(' ');
    if (contact?.name) return contact.name;
    if (contact?.email) {
      const p = contact.email.split('@')[0];
      return p.charAt(0).toUpperCase() + p.slice(1);
    }
    return 'Unknown';
  },
};
