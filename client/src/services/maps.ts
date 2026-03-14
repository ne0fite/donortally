import { GOOGLE_MAPS_API_KEY } from '../config';

export interface AddressFields {
  address1: string;
  city: string;
  state: string;
  postalCode: string;
}

let bootstrapPromise: Promise<void> | null = null;

function loadBootstrap(): Promise<void> {
  if ((window as any).google?.maps?.importLibrary) return Promise.resolve();
  if (bootstrapPromise) return bootstrapPromise;

  bootstrapPromise = new Promise<void>((resolve, reject) => {
    const callbackName = '__gmapsBootstrap';
    (window as any)[callbackName] = () => {
      delete (window as any)[callbackName];
      resolve();
    };
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&loading=async&callback=${callbackName}`;
    script.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(script);
  });

  return bootstrapPromise;
}

export async function loadPlacesAutocomplete(): Promise<any> {
  if (!GOOGLE_MAPS_API_KEY) return null;
  await loadBootstrap();
  const { PlaceAutocompleteElement } = await (window as any).google.maps.importLibrary('places');
  return PlaceAutocompleteElement;
}

export async function extractAddressFields(place: any): Promise<AddressFields> {
  await place.fetchFields({ fields: ['addressComponents'] });
  const get = (type: string, short = false) => {
    const c = place.addressComponents?.find((ac: any) => ac.types.includes(type));
    return short ? (c?.shortText ?? '') : (c?.longText ?? '');
  };

  return {
    address1: [get('street_number'), get('route')].filter(Boolean).join(' '),
    city: get('locality') || get('sublocality_level_1') || get('administrative_area_level_2'),
    state: get('administrative_area_level_1', true),
    postalCode: get('postal_code'),
  };
}
