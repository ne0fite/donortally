import { Component, Event, EventEmitter, h, Prop } from '@stencil/core';
import { formatNumber } from '../../services/format';

@Component({
  tag: 'app-pager',
  shadow: false,
})
export class AppPager {
  @Prop() page!: number;
  @Prop() totalPages!: number;
  @Prop() totalResults!: number;
  @Prop() pageSize: number = 25;

  @Event() pageChange!: EventEmitter<number>;
  @Event() pageSizeChange!: EventEmitter<number>;

  render() {
    return (
      <div class="flex items-center justify-between mt-4">
        <div class="flex gap-2">
          <button
            onClick={() => this.pageChange.emit(1)}
            disabled={this.page === 1}
            class="w-9 py-1.5 flex items-center justify-center rounded-lg border border-gray-300 text-sm disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="8,3 3,8 8,13" />
              <polyline points="13,3 8,8 13,13" />
            </svg>
          </button>
          <button
            onClick={() => this.pageChange.emit(Math.max(1, this.page - 1))}
            disabled={this.page === 1}
            class="w-9 py-1.5 flex items-center justify-center rounded-lg border border-gray-300 text-sm disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="10,3 5,8 10,13" />
            </svg>
          </button>
          <button
            onClick={() => this.pageChange.emit(Math.min(this.totalPages, this.page + 1))}
            disabled={this.page === this.totalPages}
            class="w-9 py-1.5 flex items-center justify-center rounded-lg border border-gray-300 text-sm disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6,3 11,8 6,13" />
            </svg>
          </button>
          <button
            onClick={() => this.pageChange.emit(this.totalPages)}
            disabled={this.page === this.totalPages}
            class="w-9 py-1.5 flex items-center justify-center rounded-lg border border-gray-300 text-sm disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3,3 8,8 3,13" />
              <polyline points="8,3 13,8 8,13" />
            </svg>
          </button>
          <select
            onChange={(e) => this.pageSizeChange.emit(parseInt((e.target as HTMLSelectElement).value))}
            class="px-3 py-1.5 rounded-lg border border-gray-300 text-sm hover:bg-gray-50 transition-colors"
          >
            {[10, 25, 50, 100, 200].map(opt => (
              <option value={opt} selected={this.pageSize === opt}>{opt} / page</option>
            ))}
          </select>
        </div>
        <p class="text-sm text-gray-500">
          Page {this.page} of {formatNumber(this.totalPages)} &middot; {formatNumber(this.totalResults)} results
        </p>
      </div>
    );
  }
}
