import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsNotEmpty, IsString } from 'class-validator';

export class DeleteItemsDto {
    @IsString()
    @IsNotEmpty()
    @ApiProperty({ example: '3ad500aef3900553fb6b66866d816a06691482eab5b05237eab76f424691708d' })
    DomainKey: string;

    @IsArray()
    @ArrayNotEmpty()
    @IsString({ each: true })
    @ApiProperty({})
    DomainItemIds: string[];
}
