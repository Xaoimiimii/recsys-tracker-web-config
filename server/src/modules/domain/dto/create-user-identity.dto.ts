import { ApiProperty } from "@nestjs/swagger";
import { UserIdentityDto } from "./create-domain.dto";
import { IsNotEmpty, IsString } from "class-validator";

export class CreateUserIdentityDto extends UserIdentityDto {
    @ApiProperty({ example: "this is key!" })
    @IsNotEmpty()
    @IsString()
    DomainKey: string
}