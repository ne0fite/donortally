import { Component, h, State } from '@stencil/core';
import { state, onChange, CurrentUser } from '../../store/auth.store';
import { parseRoute, ParsedRoute } from '../../services/router';
import { api } from '../../services/api';

@Component({
  tag: 'app-root',
  shadow: false,
})
export class AppRoot {
  @State() token: string | null = state.token;
  @State() orgName: string | null = state.orgName;
  @State() currentUser: CurrentUser | null = state.currentUser;
  @State() path: string = window.location.pathname + window.location.search;

  private onPopState = () => {
    this.path = window.location.pathname + window.location.search;
  };

  async componentWillLoad() {
    if (state.token) {
      this.fetchOrgName();
    }
  }

  connectedCallback() {
    onChange('token', (value) => {
      this.token = value;
      if (value) {
        this.fetchOrgName();
      } else {
        state.orgName = null;
        state.currentUser = null;
      }
    });
    onChange('orgName', (value) => (this.orgName = value));
    onChange('currentUser', (value) => (this.currentUser = value));
    window.addEventListener('popstate', this.onPopState);
  }

  disconnectedCallback() {
    window.removeEventListener('popstate', this.onPopState);
  }

  private async fetchOrgName() {
    try {
      const me = await api.get<{ id: string; firstName: string; lastName: string; email: string; organization: { name: string }; googleMapsApiKey: string }>('/user/me');
      state.orgName = me.organization?.name ?? null;
      state.currentUser = { id: me.id, firstName: me.firstName, lastName: me.lastName, email: me.email };
      state.googleMapsApiKey = me.googleMapsApiKey ?? null;
    } catch {
      // non-fatal — header just won't show org name
    }
  }

  render() {
    if (!this.token) return <app-login />;

    const route: ParsedRoute = parseRoute(this.path);

    let content: any;
    if (route.name === 'dashboard') content = <app-dashboard />;
    else if (route.name === 'donor-new') content = <app-donor-new />;
    else if (route.name === 'donor-import') content = <app-donor-import />;
    else if (route.name === 'donor-edit') content = <app-donor-edit donorId={route.donorId} />;
    else if (route.name === 'donor-history') content = <app-donor-history donorId={route.donorId} />;
    else if (route.name === 'donors') content = <app-donors />;
    else if (route.name === 'donations') content = <app-donations />;
    else if (route.name === 'donation-new') content = <app-donation-new preselectedDonorId={route.preselectedDonorId} />;
    else if (route.name === 'donation-import') content = <app-donation-import />;
    else if (route.name === 'donation-edit') content = <app-donation-edit donationId={route.donationId} returnTo={route.returnTo} />;
    else if (route.name === 'campaigns') content = <app-campaigns />;
    else if (route.name === 'campaign-new') content = <app-campaign-new />;
    else if (route.name === 'campaign-edit') content = <app-campaign-edit campaignId={route.campaignId} />;
    else if (route.name === 'users') content = <app-users />;
    else if (route.name === 'user-new') content = <app-user-new />;
    else if (route.name === 'user-edit') content = <app-user-edit userId={route.userId} />;
    else if (route.name === 'profile') content = <app-profile />;
    else if (route.name === 'settings') content = <app-settings />;
    else content = <app-dashboard />;

    return (
      <div class="flex flex-col min-h-screen">
        <app-header orgName={this.orgName} currentUser={this.currentUser} />
        <div class="flex flex-1 min-h-0">
          <app-nav currentPath={this.path} />
          <div class="flex-1 min-w-0">{content}</div>
        </div>
      </div>
    );
  }
}
