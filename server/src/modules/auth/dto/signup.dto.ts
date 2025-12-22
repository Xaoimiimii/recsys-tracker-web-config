import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SignUpDto {
    @ApiProperty({ example: 'user123', description: 'The username of the user' })
    @IsString()
    @IsNotEmpty()
    username: string;

    @ApiProperty({ example: 'strongPassword123', description: 'The password of the user' })
    @IsString()
    @IsNotEmpty()
    password: string;
    
    @ApiProperty({ example: 'This is Ly Ngoc Han hihi', description: 'The full name of the user' })
    @IsString()
    @IsNotEmpty()
    name: string;
}