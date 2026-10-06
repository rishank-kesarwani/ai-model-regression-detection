import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export type NotificationEventType =
  | 'EVALUATION_COMPLETED'
  | 'REGRESSION_DETECTED'
  | 'SEVERE_REGRESSION_DETECTED'
  | 'EVALUATION_FAILED'
  | 'SCHEDULED_EVALUATION_SUMMARY';

export interface NotificationPayload {
  eventType: NotificationEventType;
  title: string;
  message: string;
  project: string;
  runId: string;
  datasetId: string;
  decision: string;
  regressionsCount?: number;
  details?: Record<string, any>;
  channels?: string[]; // e.g. ['slack', 'email', 'webhook']
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly client: AxiosInstance;
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('notification.baseUrl', '');
    this.apiKey = this.configService.get<string>('notification.apiKey', '');

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'X-Service-Name': 'ai-model-regression-detection',
      },
    });
  }

  async sendNotification(payload: NotificationPayload): Promise<boolean> {
    this.logger.log(
      `[Notification Event] ${payload.eventType} for Run ${payload.runId} (${payload.project}): ${payload.title} - Decision: ${payload.decision}`,
    );

    const isMockOrUnreachable = !this.baseUrl || this.apiKey.includes('mock') || this.apiKey.includes('replace');

    if (!isMockOrUnreachable) {
      try {
        await this.client.post('/notifications', {
          service: 'ai-model-regression-detection',
          eventType: payload.eventType,
          title: payload.title,
          body: payload.message,
          data: {
            project: payload.project,
            runId: payload.runId,
            datasetId: payload.datasetId,
            decision: payload.decision,
            regressionsCount: payload.regressionsCount,
            details: payload.details,
          },
          channels: payload.channels || ['slack', 'email'],
        });
        return true;
      } catch (err: any) {
        this.logger.warn(`Failed to dispatch notification to Notification Service (${err.message}).`);
        return false;
      }
    }

    return true;
  }
}
