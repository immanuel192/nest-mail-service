import { Injectable, Inject } from '@nestjs/common';
import { ClassProvider, OnModuleInit } from '@nestjs/common/interfaces';
import { IMTAStategyService } from './mta.strategy.service.interface';
import { IOC_KEY, ILoggerInstance, PROVIDERS, IConfiguration, EMailStatus } from '../../commons';
import { MailStatusDto } from '../../dto';
import { IMailTransferAgent, MailGunMTA, SendGridMTA } from '../mta';

/**
 * Smart MTA Stategy
 */
@Injectable()
export class MTAStategyService implements IMTAStategyService, OnModuleInit {
  static get [IOC_KEY](): ClassProvider {
    return {
      provide: IMTAStategyService,
      useClass: MTAStategyService
    };
  }

  private availableMTA: IMailTransferAgent[] = [];

  constructor(
    @Inject(PROVIDERS.ROOT_LOGGER)
    private readonly logger: ILoggerInstance,
    private readonly configService: IConfiguration
  ) { }

  async onModuleInit() {
    this.availableMTA.push(new SendGridMTA(this.logger, this.configService));
    this.availableMTA.push(new MailGunMTA(this.logger, this.configService));
    await Promise.all(this.availableMTA.map(mta => mta.init()));
  }

  async getMTA(lastStatus: MailStatusDto): Promise<IMailTransferAgent> {
    // prefer to retry with the previous mta
    debugger;
    if (lastStatus.type === EMailStatus.Attempt) {
      const previousMTAInstance = this.availableMTA.find(t => t.name === lastStatus.mta && t.isAvailable);
      if (previousMTAInstance
        && (lastStatus.retries || 0) < previousMTAInstance.getMaxRetries() // can retry?
      ) {
        return previousMTAInstance;
      }
    }

    return this.availableMTA.find(t => t.isAvailable
      // either first try (Init state) or not use previous one
      && (!lastStatus.mta || lastStatus.mta !== t.name)
    );
  }
}
