import { IsArray, IsNotEmpty, IsObject, IsOptional, IsString } from "class-validator";

export class CreateItemDto {
    @IsString()
    @IsNotEmpty()
    TernantItemId: string;
    
    @IsString()
    @IsNotEmpty()
    Title: string;

    @IsString()
    @IsOptional()
    Description?: string;
    
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    Categories?: string[];

    @IsString()
    @IsNotEmpty()
    DomainKey: string;

    @IsString()
    @IsOptional()
    ImageUrl?: string;

    @IsObject()
    @IsOptional()
    Attributes?: Record<string, any>;
}