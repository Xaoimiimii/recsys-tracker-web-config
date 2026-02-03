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
    triggerTrainModels(
        @Query('domain_id') domainId?: number,
        @Query('epochs') epochs?: number,
        @Query('pla_epochs') plaEpochs?: number,
        @Query('batch_size') batchSize?: number,
        @Query('tolerance') tolerance?: number,
        @Query('save_after_train') saveAfterTrain?: string,
        @Query('train_submodels') trainSubmodels?: string,
    ): Observable<MessageEvent> {
        return this.recommendationService.triggerTrainModels(
            domainId,
            epochs,
            plaEpochs,
            batchSize,
            tolerance,
            saveAfterTrain === 'true',
            trainSubmodels === 'true',
        ).pipe(
            map((data) => ({ data } as MessageEvent)),
        );
    }
}
