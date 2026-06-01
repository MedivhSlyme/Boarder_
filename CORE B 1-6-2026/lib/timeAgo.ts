export function timeAgo(dateStr: string | undefined): string {
  if (!dateStr) return 'a while ago';
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function isInactiveFor5Min(lastSeen: string): boolean {
    const diff = Date.now() - new Date(lastSeen).getTime();
    return diff > 5 * 60 * 1000;
  }

  export function isInactiveFor30Min(dateStr: string | undefined): boolean {
  if (!dateStr) return true;
  const diff = Date.now() - new Date(dateStr).getTime();
  return diff > 30 * 60 * 1000;
}
