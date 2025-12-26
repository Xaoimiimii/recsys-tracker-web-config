import { apiFetch } from './client';

export interface CreateItemInput {
    TernantItemId: string;
    Title: string;
    Description?: string;
    Categories?: string[];
    DomainKey: string;
}

export interface CreateReviewInput {
    itemId: string;
    userId: string;
    rating: number;
    DomainKey: string;
    review?: string;
}

export const itemApi = {
    createBulk: async (items: CreateItemInput[]) => {
        return apiFetch('/item/create', {
            method: 'POST',
            body: JSON.stringify(items),
        });
    },
};

export interface CreateReviewResponse {
    success: { item: CreateReviewInput; rating: any }[];
    failed: { item: CreateReviewInput; reason: string }[];
}

export const reviewApi = {
    createBulk: async (reviews: CreateReviewInput[]): Promise<CreateReviewResponse> => {
        return apiFetch('/rating/create', {
            method: 'POST',
            body: JSON.stringify(reviews),
        });
    },
};