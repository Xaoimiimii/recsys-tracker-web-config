import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString } from "class-validator";
import { CustomizingFieldValueDto } from "./create-return-method.dto";

export class UpdateReturnMethodDto {
    @IsNumber()
    @IsNotEmpty()
    @ApiProperty({ example: 1 })
    Id: number;
    
    @IsString()
    @IsOptional()
    @ApiProperty({ example: 'Return Method Configuration Name' })
    ConfigurationName?: string;

    @IsNumber()
    @IsOptional()
    @ApiProperty({ example: 123 })
    OperatorId?: number;

    @IsString()
    @IsOptional()
    @ApiProperty({ example: '/song' })
    Value?: string;

    @IsOptional()
    @IsArray()
    @IsObject({ each: true })
    @ApiProperty({
        type: 'array',
        example: [
            { album: { position: 1, isEnabled: true } },
            { theme: { position: 2, isEnabled: false } }
        ]
    })
    CustomizingFields?: Record<string, CustomizingFieldValueDto>[];

    @IsOptional()
    @IsObject()
    @ApiProperty({
        type: 'object',
        additionalProperties: true,
        example: {
            displayMode: 'popup',
            modes: {
                carousel: {
                    itemsPerView: 1,
                    gap: 'md',
                    responsive: {
                        xs: { itemsPerView: 1 }
                    }
                }
            },
            wrapper: {
                popup: {
                    position: 'center',
                    widthMode: 'fixed',
                    width: 500
                }
            },
            card: {
                blocks: ['image', 'fields', 'actions'],
                fields: {
                    renderMode: 'stack',
                    gap: 'sm'
                }
            }
        }
    })
    LayoutJson?: Record<string, any>;

    @IsOptional()
    @IsObject()
    @ApiProperty({
        type: 'object',
        additionalProperties: true,
        example: {
            theme: 'light',
            tokens: {
                colors: {
                    overlay: 'rgba(0,0,0,0.5)'
                },
            }
        }
    })
    StyleJson?: Record<string, any>;

    @IsNumber()
    @IsOptional()
    @ApiProperty({ example: 60 })
    DelayDuration?: number;
}