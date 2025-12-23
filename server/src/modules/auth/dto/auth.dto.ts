import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class AuthDto {
    @ApiProperty({ example: 'user123', description: 'The username of the user' })
    @IsString()
    @IsNotEmpty()
    username: string;

    @ApiProperty({ example: 'strongPassword123', description: 'The password of the user' })
    @IsString()
    @IsNotEmpty()
    password: string;
}