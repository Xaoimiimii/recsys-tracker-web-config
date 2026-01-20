import { IsNotEmpty, IsNumber } from "class-validator";
import { UserIdentityDto } from "./create-domain.dto";
import { ApiProperty, PartialType } from "@nestjs/swagger";

export class UpdateUserIdentityDto extends PartialType(UserIdentityDto) {
    @ApiProperty({example: 1})
    @IsNotEmpty()
    @IsNumber()
    Id: number
}