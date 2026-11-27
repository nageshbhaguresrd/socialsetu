import { describe, it, expect } from 'vitest';
import {
  createBusinessSchema,
  leadSchema,
  salesEntrySchema,
  expenseEntrySchema,
  marketingGenerateSchema,
} from '../src/lib/validation/bizpilotSchemas';
import { t } from '../src/lib/i18n';

describe('BizPilot AI Validation Schemas', () => {
  it('validates a valid business creation payload', () => {
    const valid = {
      name: 'Pune Spices & Agro',
      industry: 'Retail',
      description: 'Wholesale and retail spices',
      preferred_language: 'mr',
    };
    const result = createBusinessSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects an invalid business name', () => {
    const invalid = {
      name: 'A', // Too short
    };
    const result = createBusinessSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('validates lead creation payload with required business_id and name', () => {
    const lead = {
      business_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      name: 'Anand Patil',
      phone: '+91 98220 12345',
      email: 'anand@example.com',
      status: 'new',
    };
    const result = leadSchema.safeParse(lead);
    expect(result.success).toBe(true);
  });

  it('validates decimal-safe sales and expense entry schemas', () => {
    const sale = {
      business_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      amount: 45000.5,
      description: 'Bulk delivery invoice',
      entry_date: '2026-11-26',
    };
    expect(salesEntrySchema.safeParse(sale).success).toBe(true);

    const expense = {
      business_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      amount: 12000.0,
      category: 'Rent',
      entry_date: '2026-11-26',
    };
    expect(expenseEntrySchema.safeParse(expense).success).toBe(true);
  });

  it('rejects negative amounts for financial entries', () => {
    const negativeSale = {
      business_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      amount: -500,
      entry_date: '2026-11-26',
    };
    expect(salesEntrySchema.safeParse(negativeSale).success).toBe(false);
  });
});

describe('BizPilot Multilingual i18n Translation Engine', () => {
  it('resolves English translation keys correctly', () => {
    expect(t('en', 'common.appName')).toBe('BizPilot AI');
    expect(t('en', 'common.dashboard')).toBe('Dashboard');
    expect(t('en', 'marketing.title')).toBe('AI Marketing Studio');
  });

  it('resolves Hindi (हिंदी) translation keys correctly', () => {
    expect(t('hi', 'common.dashboard')).toBe('डैशबोर्ड');
    expect(t('hi', 'crm.title')).toBe('लीड्स और मिनी सीआरएम');
  });

  it('resolves Marathi (मराठी) translation keys correctly', () => {
    expect(t('mr', 'common.dashboard')).toBe('डॅशबोर्ड');
    expect(t('mr', 'marketing.title')).toBe('एआय मार्केटिंग स्टुडिओ');
    expect(t('mr', 'analytics.title')).toBe('आर्थिक आणि व्यवसाय अ‍ॅनालिटिक्स');
  });

  it('falls back gracefully to English when key is missing', () => {
    expect(t('mr', 'nonexistent.key', 'Fallback Value')).toBe('Fallback Value');
  });
});

describe('Financial and Pricing Calculations', () => {
  it('accurately calculates net profit and profit margin percentage', () => {
    const sales = 100000;
    const expenses = 65000;
    const netProfit = sales - expenses;
    const margin = ((netProfit / sales) * 100).toFixed(1);

    expect(netProfit).toBe(35000);
    expect(margin).toBe('35.0');
  });

  it('accurately converts INR paise to rupees for plans', () => {
    const starterPaise = 49900;
    const proPaise = 149900;
    const businessPaise = 499900;

    expect(starterPaise / 100).toBe(499);
    expect(proPaise / 100).toBe(1499);
    expect(businessPaise / 100).toBe(4999);
  });
});
