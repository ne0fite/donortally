export type ParsedRoute =
  | { name: 'dashboard' }
  | { name: 'donors' }
  | { name: 'donor-new' }
  | { name: 'donor-import' }
  | { name: 'donor-edit'; donorId: string }
  | { name: 'donor-history'; donorId: string }
  | { name: 'donations' }
  | { name: 'donation-new'; preselectedDonorId?: string }
  | { name: 'donation-import' }
  | { name: 'donation-edit'; donationId: string; returnTo?: string }
  | { name: 'campaigns' }
  | { name: 'campaign-new' }
  | { name: 'campaign-edit'; campaignId: string }
  | { name: 'users' }
  | { name: 'user-new' }
  | { name: 'user-edit'; userId: string }
  | { name: 'profile' }
  | { name: 'settings' }
  | { name: 'activate' };

export function parseRoute(path: string): ParsedRoute {
  if (path === '/') return { name: 'dashboard' };
  if (path === '/dashboard') return { name: 'dashboard' };
  if (path === '/donors') return { name: 'donors' };
  if (path === '/donors/new') return { name: 'donor-new' };
  if (path === '/donors/import') return { name: 'donor-import' };
  const donorEditMatch = path.match(/^\/donors\/([^/]+)\/edit$/);
  if (donorEditMatch) return { name: 'donor-edit', donorId: donorEditMatch[1] };
  const donorHistoryMatch = path.match(/^\/donors\/([^/]+)\/history$/);
  if (donorHistoryMatch) return { name: 'donor-history', donorId: donorHistoryMatch[1] };
  if (path === '/donations') return { name: 'donations' };
  if (path.startsWith('/donations/new')) {
    const queryStr = path.split('?')[1] ?? '';
    const params = new URLSearchParams(queryStr);
    const preselectedDonorId = params.get('donorId') ?? undefined;
    return { name: 'donation-new', preselectedDonorId };
  }
  if (path === '/donations/import') return { name: 'donation-import' };
  const donationEditMatch = path.match(/^\/donations\/([^/]+)\/edit/);
  if (donationEditMatch) {
    const queryStr = path.split('?')[1] ?? '';
    const params = new URLSearchParams(queryStr);
    const returnTo = params.get('returnTo') ?? undefined;
    return { name: 'donation-edit', donationId: donationEditMatch[1], returnTo };
  }
  if (path === '/campaigns') return { name: 'campaigns' };
  if (path === '/campaigns/new') return { name: 'campaign-new' };
  const campaignEditMatch = path.match(/^\/campaigns\/([^/]+)\/edit$/);
  if (campaignEditMatch) return { name: 'campaign-edit', campaignId: campaignEditMatch[1] };
  if (path === '/users') return { name: 'users' };
  if (path === '/users/new') return { name: 'user-new' };
  const userEditMatch = path.match(/^\/users\/([^/]+)\/edit$/);
  if (userEditMatch) return { name: 'user-edit', userId: userEditMatch[1] };
  if (path === '/profile') return { name: 'profile' };
  if (path === '/settings') return { name: 'settings' };
  if (path.startsWith('/activate')) return { name: 'activate' };
  return { name: 'donors' };
}

export function navigate(path: string) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}
