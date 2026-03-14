import { Component, h, Prop } from '@stencil/core';
import { navigate } from '../../services/router';

interface NavItem {
  label: string;
  path: string;
  matchPrefix: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', matchPrefix: '/dashboard' },
  { label: 'Donors', path: '/donors', matchPrefix: '/donors' },
  { label: 'Donations', path: '/donations', matchPrefix: '/donations' },
  { label: 'Campaigns', path: '/campaigns', matchPrefix: '/campaigns' },
  { label: 'Users', path: '/users', matchPrefix: '/users' },
];

@Component({
  tag: 'app-nav',
  shadow: false,
})
export class AppNav {
  @Prop() currentPath: string = '/';

  private isActive(item: NavItem): boolean {
    if (item.matchPrefix === '/dashboard') {
      return this.currentPath === '/' || this.currentPath.startsWith('/dashboard');
    }
    return this.currentPath.startsWith(item.matchPrefix);
  }

  render() {
    return (
      <nav class="w-56 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
        <div class="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              class={
                `w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ` +
                (this.isActive(item)
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900')
              }
            >
              {item.label}
            </button>
          ))}
        </div>
        <footer class="px-4 py-3 text-xs text-gray-400 border-t border-gray-100">
          &copy; {new Date().getFullYear()} PhoenixBright, LLC
        </footer>
      </nav>
    );
  }
}
