import { apiFetch } from './client';

export interface CreateItemInput {
  TernantItemId: string;
  Title: string;
  Description?: string;
  Categories?: string[];
  ImageUrl?: string;
  DomainKey: string;
}

export interface CreateReviewInput {
  itemId: string;
  userId: string;
  rating: number;
  review?: string;
  DomainKey: string;
}

export const itemApi = {
    createBulk: async (items: CreateItemInput[]) => {
        console.log('=== ITEM API - CREATE BULK ===');
        console.log('Sending items:', items.length);
        console.log('Items data:', JSON.stringify(items, null, 2));
        
        const result = await apiFetch('/item/create', {
            method: 'POST',
            body: JSON.stringify(items),
        });
        
        console.log('=== API RESPONSE ===', result);
        return result;
    },
};

export const reviewApi = {
    createBulk: async (reviews: CreateReviewInput[]) => {
        return apiFetch('/rating/create', {
            method: 'POST',
            body: JSON.stringify(reviews),
        });
    },
};