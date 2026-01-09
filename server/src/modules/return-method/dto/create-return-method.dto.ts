import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, ValidateNested } from "class-validator";
import { ReturnType } from "src/generated/prisma/enums";
import { ApiProperty } from "@nestjs/swagger";
import { Type, Transform } from "class-transformer";

export class CustomizingFieldValueDto {
    @ApiProperty({ example: 1 })
    position: number;

    @ApiProperty({ example: true })
    isEnabled: boolean;
}

export class CreateReturnMethodDto {
    @ApiProperty({ example: 'domain key' })
    @IsString()
    @IsNotEmpty()
    Key: string;

    @ApiProperty({ example: 'configuration name' })
    @IsString()
    @IsNotEmpty()
    ConfigurationName: string;

    @ApiProperty({ enum: ReturnType, example: 'POPUP' })
    @IsEnum(ReturnType)
    @IsNotEmpty()
    ReturnType: ReturnType;

    @ApiProperty({ example: 'value' })
    @IsString()
    @IsNotEmpty()
    Value: string;

    @ApiProperty({ example: 1 })
    @IsNumber()
    @IsNotEmpty()
    OperatorId: number;

    @IsOptional()
    @IsArray()
    @Transform(({ value }) => {
        if (!value) return [];
        return value;
    })
    @ApiProperty({
        type: 'array',
        items: {
            type: 'object',
            additionalProperties: {
                type: 'object',
                properties: {
                    position: { type: 'number' },
                    isEnabled: { type: 'boolean' }
                }
            }
        },
        example: [
            { album: { position: 1, isEnabled: true } },
            { theme: { position: 2, isEnabled: false } }
        ]
    })
    CustomizingFields?: Record<string, CustomizingFieldValueDto>[];

    @IsNotEmpty()
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
    LayoutJson: Record<string, any>;

    @IsNotEmpty()
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
    StyleJson: Record<string, any>;

    @IsNumber()
    @IsNotEmpty()
    @ApiProperty({ example: 60 })
    DelayDuration: number;
}