import { apiFetch } from './client';

export interface CreateItemInput {
  TernantItemId: string;
  Title: string;
  Description?: string;
  Categories?: string[];
  ImageUrl?: string;
  DomainKey: string;
  Attributes?: Record<string, any>;
}

export interface CreateReviewInput {
  itemId: string;
  userId: string;
  rating: number;
  review?: string;
  DomainKey: string;
}

export interface UpdateItemInput {
  TernantItemId: string;
  Title: string;
  Description?: string;
  Categories?: string[];
  ImageUrl?: string;
  DomainKey: string;
  Attributes?: Record<string, any>;
}

export const itemApi = {
    createBulk: async (items: CreateItemInput[]) => {
        return apiFetch('/item/create', {
            method: 'POST',
            body: JSON.stringify(items),
        });
    },
    updateBulk: async (items: UpdateItemInput[]) => {
        return apiFetch('/item', {
            method: 'PATCH',
            body: JSON.stringify(items),
        });
    },
    getItems: async (domainKey: string, page: number = 1, size: number = 10) => {
        return apiFetch(`/item/${domainKey}?page=${page}&size=${size}`, {
            method: 'GET',
        });
    },
    deleteItems: async (domainKey: string, domainItemIds: string[]) => {
        return apiFetch('/item', {
            method: 'DELETE',
            body: JSON.stringify({
                DomainKey: domainKey,
                DomainItemIds: domainItemIds,
            }),
        });
    }
};

export const reviewApi = {
    createBulk: async (reviews: CreateReviewInput[]) => {
        return apiFetch('/rating/create', {
            method: 'POST',
            body: JSON.stringify(reviews),
        });
    },
};