import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from "class-validator";

export class CreateRatingDto {
    @IsString()
    @IsNotEmpty()
    itemId: string;

    @IsString()
    @IsNotEmpty()
    userId: string;

    @IsNumber()
    @Min(1)
    @Max(5)
    rating: number;

    @IsString()
    @IsOptional()
    review?: string;

    @IsString()
    @IsNotEmpty()
    DomainKey: string;
}
