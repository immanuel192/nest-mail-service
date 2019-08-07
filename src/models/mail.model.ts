import { ObjectId } from 'mongodb';
import { MailStatusDto } from '../dto';

export interface MailModel {
  _id?: ObjectId;
  to: string[];
  cc: string[];
  bcc: string[];
  title: string;
  content: string;
  status: MailStatusDto[];

  /**
   * Actual send on date, when user created this email
   */
  sentOn?: Date;

  /**
   * Deliveried date
   */
  deliveriedDate?: Date;
}
