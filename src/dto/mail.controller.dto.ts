import { ApiModelProperty } from '@nestjs/swagger';
import { IsString, MinLength, IsOptional, IsEmail, IsArray } from 'class-validator';

export class SendMailRequestDto {
  @ApiModelProperty({
    required: true,
    description: 'Mail title',
    minLength: 1
  })
  @IsString()
  @MinLength(1)
  readonly title: string;

  @ApiModelProperty({
    required: true,
    description: 'Mail content',
    minLength: 1
  })
  @IsString()
  @MinLength(1)
  readonly content: string;

  @ApiModelProperty({
    required: true,
    description: 'Receiver addresses',
    example: ['test@gmail.com'],
    isArray: true,
    minLength: 1,
    type: String
  })
  @IsArray()
  @IsString({ each: true })
  @IsEmail({}, { each: true })
  readonly to: string[];

  @ApiModelProperty({
    required: false,
    description: 'CC addresses',
    example: ['test@gmail.com'],
    isArray: true,
    minLength: 1,
    type: String
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsEmail({}, { each: true })
  readonly cc?: string[];

  @ApiModelProperty({
    required: false,
    description: 'BCC addresses',
    example: ['test@gmail.com'],
    isArray: true,
    minLength: 1,
    type: String
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsEmail({}, { each: true })
  readonly bcc?: string[];
}

class SendMailResultDto {
  @ApiModelProperty({
    required: true,
    description: 'Email id, in UUID format',
    example: '5d4601128e98533b66875b71'
  })
  @IsString()
  _id: string;
}

export class SendMailResponseDto {
  @ApiModelProperty({
    required: true,
    type: SendMailResultDto
  })
  data: SendMailResultDto;
}
