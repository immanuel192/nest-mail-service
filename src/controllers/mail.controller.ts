import { Controller, Post, Body } from '@nestjs/common';
import { ApiUseTags, ApiCreatedResponse, ApiBadRequestResponse, ApiOperation, ApiInternalServerErrorResponse } from '@nestjs/swagger';
import { IMailService } from '../services';
import { SendMailRequestDto, SendMailResponseDto } from '../dto';

@ApiUseTags('email')
@Controller('/api/emails')
export default class MailController {
  constructor(
    private readonly mailService: IMailService
  ) { }

  @Post('')
  @ApiOperation({ title: 'Send email' })
  @ApiCreatedResponse({
    description: 'Email sending request has been created successfully',
    type: SendMailResponseDto
  })
  @ApiBadRequestResponse({})
  @ApiInternalServerErrorResponse({})
  create(
    @Body()
    inp: SendMailRequestDto,
  ) {
    return this.mailService.insert({ ...inp })
      .then(newMailInfo => ({
        data: { id: newMailInfo._id.toHexString() }
      }));
  }
}
