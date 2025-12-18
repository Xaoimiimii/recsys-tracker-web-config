import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreateDomainDto {
    @IsNotEmpty()
    @IsString()
    url: string;

    @IsOptional()  
    @IsNumber()
    type: number;
}
