import { ApiProperty, PartialType } from "@nestjs/swagger";
import { CreateSearchKeywordConfigDto } from "./create-search-keyword-config.dto";
import { IsNotEmpty, IsNumber } from "class-validator";

export class UpdateSearchKeywordDto extends PartialType(CreateSearchKeywordConfigDto) {
    @IsNumber()
    @IsNotEmpty()
    @ApiProperty({ example: 1 })
    Id: number;
}