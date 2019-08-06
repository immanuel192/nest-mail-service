import { ObjectId } from 'mongodb';
export * from './mail.controller.dto';
export * from './queue.dto';

/**
 * Insert mail info dto
 */
export interface InsertMailInfoDto {
  title: string;
  content: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
}

/**
 * An email dto
 */
export interface MailDto {
  _id?: ObjectId;
  to: string[];
  cc: string[];
  bcc: string[];
  title: string;
  content: string;
  status: any[];

  /**
   * Actual send on date, when user created this email
   */
  sentOn?: Date;

  /**
   * Deliveried date
   */
  deliveriedDate?: Date;
}

/**
 * An DTO to describe a mail when attempt to be sent
 */
export interface AttemptMailSendingDto {
  to: string[];
  cc: string[];
  bcc: string[];
  title: string;
  content: string;
}
