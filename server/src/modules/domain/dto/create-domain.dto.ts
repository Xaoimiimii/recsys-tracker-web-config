import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum, IsObject, IsBoolean } from 'class-validator';
import { UserIdentityField, UserIdentitySource } from 'src/generated/prisma/enums';

export class UserIdentityDto {
    @ApiProperty({ example: UserIdentitySource.local_storage })
    @IsNotEmpty()
    @IsEnum(UserIdentitySource)
    Source: UserIdentitySource

    @ApiProperty({})
    @IsOptional()
    @IsObject()
    RequestConfig: Object

    @ApiProperty({})
    @IsOptional()
    @IsString()
    Value: string

    @ApiProperty({ example: UserIdentityField.UserId })
    @IsNotEmpty()
    @IsEnum(UserIdentityField)
    Field: UserIdentityField
}

export class CreateDomainDto {
    @ApiProperty({example: "https://example.com.vn"})
    @IsNotEmpty()
    @IsString()
    url: string;

    @ApiProperty({ example: 1 })
    @IsOptional()  
    @IsNumber()
    type: number;

    @IsNotEmpty()
    UserIdentity: UserIdentityDto
}