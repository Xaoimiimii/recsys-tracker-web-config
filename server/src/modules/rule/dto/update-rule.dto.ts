import { ApiProperty, OmitType, PartialType } from "@nestjs/swagger";
import { CreateRuleDto } from "./create-rule.dto";
import { IsNotEmpty, IsNumber } from "class-validator";

export class UpdateRuleDto extends PartialType(
    OmitType(CreateRuleDto, ['DomainKey'] as const),
) {
    @ApiProperty({ description: 'Unique identifier of the rule', example: 1 })
    @IsNotEmpty()
    @IsNumber()
    Id: number;
}