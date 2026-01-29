import { Controller, Get, Query, ParseIntPipe, Post, Sse } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RecommendationService } from './recommendation.service';

@Controller('recommendation')
export class RecommendationController {
    constructor(private readonly recommendationService: RecommendationService) { }

    @Get()
    getRecommendations(@Query('userId', ParseIntPipe) userId: number, @Query('numberItems', ParseIntPipe) numberItems: number = 10) {
        return this.recommendationService.getRecommendations(userId, numberItems);
    }

    @Sse('train')
    triggerTrainModels(): Observable<MessageEvent> {
        return this.recommendationService.triggerTrainModels().pipe(
            map((data) => ({ data } as MessageEvent)),
        );
    }
}
