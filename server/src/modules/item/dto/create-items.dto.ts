import { IsArray, IsNotEmpty, IsOptional, IsString } from "class-validator";

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
}