import { Component, h, Prop, Event, EventEmitter, Element } from '@stencil/core';
import { loadPlacesAutocomplete, extractAddressFields } from '../../services/maps';

@Component({
  tag: 'app-address-section',
  shadow: false,
})
export class AppAddressSection {
  @Element() el!: HTMLElement;

  @Prop() address1: string = '';
  @Prop() address2: string = '';
  @Prop() city: string = '';
  @Prop() state: string = '';
  @Prop() postalCode: string = '';

  @Event() address1Change!: EventEmitter<string>;
  @Event() address2Change!: EventEmitter<string>;
  @Event() cityChange!: EventEmitter<string>;
  @Event() donorStateChange!: EventEmitter<string>;
  @Event() postalCodeChange!: EventEmitter<string>;

  private address1Input?: HTMLInputElement;
  private autocompleteContainer?: HTMLElement;
  private placeAutocompleteEl?: any;
  private placeSelectHandler = (e: Event) => this.onPlaceSelected(e as any);

  async componentDidLoad() {
    if (!this.autocompleteContainer || !this.address1Input) return;
    try {
      const PlaceAutocompleteElement = await loadPlacesAutocomplete();
      if (!PlaceAutocompleteElement) return;
      this.placeAutocompleteEl = new PlaceAutocompleteElement({ types: ['address'] });
      if (this.address1) {
        this.placeAutocompleteEl.value = this.address1;
      }
      this.placeAutocompleteEl.addEventListener('gmp-select', this.placeSelectHandler);
      this.address1Input.style.display = 'none';
      this.autocompleteContainer.appendChild(this.placeAutocompleteEl);
    } catch {
      // silently skip; fallback input remains visible
    }
  }

  disconnectedCallback() {
    if (this.placeAutocompleteEl) {
      this.placeAutocompleteEl.removeEventListener('gmp-select', this.placeSelectHandler);
    }
  }

  private async onPlaceSelected(event: any) {
    const prediction = event.placePrediction ?? event.place ?? event.detail?.place ?? event.mh;
    if (!prediction) {
      console.warn('[address] no place on event', event);
      return;
    }
    try {
      // gmp-select gives a PlacePrediction; convert to Place before fetching fields
      const place = typeof prediction.toPlace === 'function' ? prediction.toPlace() : prediction;
      const fields = await extractAddressFields(place);
      this.address1Change.emit(fields.address1);
      this.cityChange.emit(fields.city);
      this.donorStateChange.emit(fields.state);
      this.postalCodeChange.emit(fields.postalCode);
    } catch (err) {
      console.error('[address] Failed to extract address fields:', err);
    }
  }

  private renderField(
    label: string,
    value: string,
    onInput: (v: string) => void,
  ) {
    return (
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input
          type="text"
          value={value}
          autoComplete="off"
          data-lpignore="true"
          data-1p-ignore="true"
          onInput={(e) => onInput((e.target as HTMLInputElement).value)}
          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
    );
  }

  render() {
    return (
      <section class="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h3 class="text-sm font-semibold text-gray-900 uppercase tracking-wider">Address</h3>

        <div ref={(el) => (this.autocompleteContainer = el as HTMLElement)}>
          <label class="block text-sm font-medium text-gray-700 mb-1">Address line 1</label>
          {/* Fallback plain input; hidden imperatively once PlaceAutocompleteElement mounts */}
          <input
            type="text"
            value={this.address1}
            placeholder="Start typing an address…"
            onInput={(e) => this.address1Change.emit((e.target as HTMLInputElement).value)}
            autoComplete="off"
            data-lpignore="true"
          data-1p-ignore="true"
            ref={(el) => (this.address1Input = el as HTMLInputElement)}
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {this.renderField('Address line 2', this.address2, (v) => this.address2Change.emit(v))}

        <div class="grid grid-cols-3 gap-4">
          {this.renderField('City', this.city, (v) => this.cityChange.emit(v))}
          {this.renderField('State', this.state, (v) => this.donorStateChange.emit(v))}
          {this.renderField('Postal code', this.postalCode, (v) => this.postalCodeChange.emit(v))}
        </div>
      </section>
    );
  }
}
