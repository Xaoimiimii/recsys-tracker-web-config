import { Body, Controller, ParseArrayPipe, Post } from '@nestjs/common';
import { RatingService } from './rating.service';
import { CreateRatingDto } from './dto/create-rating.dto';

@Controller('rating')
export class RatingController {
    constructor(private ratingService: RatingService) { }

    @Post('create')
    async createRatings(
        @Body(new ParseArrayPipe({ items: CreateRatingDto, whitelist: true })) dtos: CreateRatingDto[]
    ) {
        return this.ratingService.createBulk(dtos);
    }
}
