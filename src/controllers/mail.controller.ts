import { Controller, Post, Body, Inject } from '@nestjs/common';
import { ApiUseTags, ApiCreatedResponse, ApiBadRequestResponse, ApiOperation, ApiInternalServerErrorResponse } from '@nestjs/swagger';
import { IMailService, IQueueProducer } from '../services';
import { SendMailRequestDto, SendMailResponseDto } from '../dto';
import { QUEUES, ILoggerInstance, PROVIDERS } from '../commons';

@ApiUseTags('email')
@Controller('/api/emails')
export default class MailController {
  constructor(
    @Inject(QUEUES.MAIN)
    private readonly mainQueue: IQueueProducer,
    @Inject(PROVIDERS.ROOT_LOGGER)
    private readonly logger: ILoggerInstance,
    private readonly mailService: IMailService,
  ) { }

  @Post('')
  @ApiOperation({ title: 'Send email' })
  @ApiCreatedResponse({
    description: 'Email sending request has been created successfully',
    type: SendMailResponseDto
  })
  @ApiBadRequestResponse({})
  @ApiInternalServerErrorResponse({})
  async create(
    @Body()
    inp: SendMailRequestDto,
  ) {
    const newMailInfo = await this.mailService.insert({ ...inp });
    const newMailId = newMailInfo._id.toHexString();
    try {
      await this.mainQueue.send(newMailId);
    }
    catch (e) {
      this.logger.error('Can not dispatch new mail sending to main queue', e.stack);
    }
    return {
      data: { id: newMailId }
    };
  }
}
