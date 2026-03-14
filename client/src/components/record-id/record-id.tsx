import { Component, h, Prop } from '@stencil/core';

@Component({
  tag: 'record-id',
  styleUrl: 'record-id.css',
  shadow: false,
})
export class RecordId {
  @Prop() value: string | null = null;

  render() {
    return <span class="record-id">{this.value || '—'}</span>;
  }
}
