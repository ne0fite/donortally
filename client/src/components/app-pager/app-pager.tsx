import { Component, Event, EventEmitter, h, Prop } from '@stencil/core';

@Component({
  tag: 'app-pager',
  shadow: false,
})
export class AppPager {
  @Prop() page!: number;
  @Prop() totalPages!: number;
  @Prop() totalResults!: number;

  @Event() pageChange!: EventEmitter<number>;

  render() {
    return (
      <div class="flex items-center justify-between mt-4">
        <div class="flex gap-2">
          <button
            onClick={() => this.pageChange.emit(1)}
            disabled={this.page === 1}
            class="px-3 py-1.5 rounded-lg border border-gray-300 text-sm disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            First
          </button>
          <button
            onClick={() => this.pageChange.emit(Math.max(1, this.page - 1))}
            disabled={this.page === 1}
            class="px-3 py-1.5 rounded-lg border border-gray-300 text-sm disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            Previous
          </button>
          <button
            onClick={() => this.pageChange.emit(Math.min(this.totalPages, this.page + 1))}
            disabled={this.page === this.totalPages}
            class="px-3 py-1.5 rounded-lg border border-gray-300 text-sm disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            Next
          </button>
          <button
            onClick={() => this.pageChange.emit(this.totalPages)}
            disabled={this.page === this.totalPages}
            class="px-3 py-1.5 rounded-lg border border-gray-300 text-sm disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            Last
          </button>
        </div>
        <p class="text-sm text-gray-500">
          Page {this.page} of {this.totalPages} &middot; {this.totalResults} results
        </p>
      </div>
    );
  }
}
