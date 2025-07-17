export interface StripeProduct {
  id: string;
  priceId: string;
  name: string;
  description: string;
  mode: 'payment' | 'subscription';
  price: number;
  currency: string;
}




export const STRIPE_PRODUCTS: StripeProduct[] = [
  {
    id: 'prod_SgmiQYMM30XECe',
    priceId: 'price_1RlP9NRq8gaO9d2HAXe7r172',
    name: 'sample product',
    description: '',
    mode: 'subscription',
    price: 5.00,
    currency: 'usd',
  },
];

export function getProductById(id: string): StripeProduct | undefined {
  return STRIPE_PRODUCTS.find(product => product.id === id);
}

export function getProductByPriceId(priceId: string): StripeProduct | undefined {
  return STRIPE_PRODUCTS.find(product => product.priceId === priceId);
}