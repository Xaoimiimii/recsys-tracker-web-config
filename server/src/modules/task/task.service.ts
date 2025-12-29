import { Injectable } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RecommendationService } from '../recommendation/recommendation.service';

@Injectable()
export class TaskService {
    private readonly logger = new Logger(TaskService.name);
    constructor(private readonly recommendationService: RecommendationService) { }

    @Cron(CronExpression.EVERY_30_MINUTES)
    trainModels() {
        this.recommendationService.triggerTrainModels();
        this.logger.debug('Called when the second is 0');
    }
}
