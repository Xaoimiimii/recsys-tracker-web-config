import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsNotEmpty, IsObject, IsOptional, IsString } from "class-validator";


export class UpdateItemDto {
    @ApiProperty({ example: "abc" })
    @IsString()
    @IsNotEmpty()
    TernantItemId: string;
    
    @ApiProperty({ example: "This is a new item title" })
    @IsString()
    @IsNotEmpty()
    Title?: string;

    @ApiProperty({ example: "This is a new item title" })    
    @IsString()
    @IsOptional()
    Description?: string;
    
    @ApiProperty({ example: ["Cate1", "Cate2"] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    Categories?: string[];

    @ApiProperty({ example: "e2e41ee860fd6f0859c8386c680d3350d9dae3ecda97e80e602403a7f8ed2c50" })
    @IsString()
    @IsNotEmpty()
    DomainKey?: string;

    @ApiProperty({ example: "https://example-image.com" })
    @IsString()
    @IsOptional()
    ImageUrl?: string;

    @ApiProperty()
    @IsObject()
    @IsOptional()
    Attributes?: Record<string, any>;
}