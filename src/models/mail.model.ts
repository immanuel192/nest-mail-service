import { ObjectId } from 'mongodb';
import { EMailStatus } from '../commons/const';

export interface MailModel {
  _id?: ObjectId;
  to: string[];
  cc: string[];
  bcc: string[];
  title: string;
  content: string;
  status: { [k: string]: any; type: EMailStatus; }[];

  /**
   * Actual send on date, when user created this email
   */
  sentOn?: Date;

  /**
   * Deliveried date
   */
  deliveriedDate?: Date;
}
