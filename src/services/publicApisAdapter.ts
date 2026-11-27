/**
 * BizPilot AI — Public APIs Provider Adapter
 * Clean, fault-tolerant integration wrappers with offline fallbacks.
 * Adheres to Section 16 of the Master Specification.
 */

export interface CurrencyConversionResult {
  from: string;
  to: string;
  rate: number;
  convertedAmount: number;
  source: 'frankfurter' | 'offline_fallback';
}

export interface CityValidationResult {
  city: string;
  state: string;
  country: string;
  isRecognized: boolean;
}

// Major Indian States & Business Hubs
const INDIAN_STATES_AND_CITIES: Record<string, string[]> = {
  Maharashtra: ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad', 'Thane', 'Solapur', 'Kolhapur'],
  Delhi: ['New Delhi', 'North Delhi', 'South Delhi', 'East Delhi', 'West Delhi'],
  Karnataka: ['Bengaluru', 'Mysuru', 'Hubballi', 'Mangaluru', 'Belagavi'],
  Gujarat: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar'],
  TamilNadu: ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem'],
  Telangana: ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar'],
  UttarPradesh: ['Lucknow', 'Kanpur', 'Varanasi', 'Agra', 'Noida', 'Prayagraj'],
  WestBengal: ['Kolkata', 'Howrah', 'Durgapur', 'Siliguri', 'Asansol'],
  Rajasthan: ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Bikaner'],
};

export class PublicApisAdapter {
  private static readonly TIMEOUT_MS = 3500;

  /**
   * Converts INR to another currency via Frankfurter API with offline fallback.
   * Useful for exporters and global analytics.
   */
  static async convertCurrency(
    amount: number,
    from: string = 'INR',
    to: string = 'USD'
  ): Promise<CurrencyConversionResult> {
    const uppercaseFrom = from.toUpperCase();
    const uppercaseTo = to.toUpperCase();

    if (uppercaseFrom === uppercaseTo) {
      return {
        from: uppercaseFrom,
        to: uppercaseTo,
        rate: 1.0,
        convertedAmount: amount,
        source: 'frankfurter',
      };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

      const res = await fetch(
        `https://api.frankfurter.app/latest?amount=${amount}&from=${uppercaseFrom}&to=${uppercaseTo}`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const rate = data.rates[uppercaseTo];
        if (typeof rate === 'number') {
          return {
            from: uppercaseFrom,
            to: uppercaseTo,
            rate: rate / amount,
            convertedAmount: rate,
            source: 'frankfurter',
          };
        }
      }
    } catch {
      // Graceful fallback to fixed conservative rates
    }

    // Offline estimated fallback rate: 1 USD ≈ 86.5 INR
    const fallbackRate = uppercaseFrom === 'INR' && uppercaseTo === 'USD' ? 0.0116 : 86.5;
    return {
      from: uppercaseFrom,
      to: uppercaseTo,
      rate: fallbackRate,
      convertedAmount: Number((amount * fallbackRate).toFixed(2)),
      source: 'offline_fallback',
    };
  }

  /**
   * Validates or looks up an Indian city/state for lead and business profile onboarding.
   */
  static validateIndianLocation(cityOrState: string): CityValidationResult {
    const query = cityOrState.trim().toLowerCase();

    for (const [state, cities] of Object.entries(INDIAN_STATES_AND_CITIES)) {
      if (state.toLowerCase() === query) {
        return {
          city: cities[0],
          state,
          country: 'India',
          isRecognized: true,
        };
      }

      const matchedCity = cities.find((c) => c.toLowerCase() === query);
      if (matchedCity) {
        return {
          city: matchedCity,
          state,
          country: 'India',
          isRecognized: true,
        };
      }
    }

    return {
      city: cityOrState,
      state: 'Unknown',
      country: 'India',
      isRecognized: false,
    };
  }

  /**
   * Returns list of supported Indian states and main commercial hubs
   */
  static getSupportedIndianLocations() {
    return INDIAN_STATES_AND_CITIES;
  }
}
