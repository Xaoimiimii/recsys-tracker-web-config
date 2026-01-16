import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, ValidateNested } from "class-validator";
import { CustomizingFieldDto } from "./create-return-method.dto";
import { Type } from "class-transformer";

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
    @ValidateNested({ each: true })
    @Type(() => CustomizingFieldDto)
    @ApiProperty({
        type: [CustomizingFieldDto],
        example: [
            { key: 'album', position: 1, isEnabled: true },
            { key: 'theme', position: 2, isEnabled: false }
        ]
    })
    CustomizingFields?: CustomizingFieldDto[];

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

    @IsOptional()
    @IsNumber()
    @ApiProperty({ example: 1 })
    SearchKeywordConfigId?: number;
}