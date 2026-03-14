import { Component, h } from '@stencil/core';

@Component({
  tag: 'app-home',
  shadow: false,
})
export class AppHome {
  render() {
    return (
      <main class="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 max-w-md w-full text-center">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">DonorTally</h1>
          <p class="text-gray-500">Donation management for your organization.</p>
        </div>
      </main>
    );
  }
}
