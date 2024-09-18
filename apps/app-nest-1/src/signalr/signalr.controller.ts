import { Controller, Post } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Controller('signalr')
export class SignalrController {
  private connectionString: string;
  private serverName: string;
  private endpointUrl: string;
  private accessKey: string;
  private hubName: string;
  private defaultPayloadMessage: any;

  constructor() {
    const connectionString =
      process.env['AZURE_SIGNALR_SERVICE_CONNECTION_STRING'];
    if (!connectionString) {
      throw new Error('Connection string is not set');
    }

    this.connectionString = connectionString;
    this.endpointUrl =
      this.getEndpointUrlFromConnectionString(connectionString);
    this.accessKey = this.getAccessKeyFromConnectionString(
      this.connectionString,
    );
    this.hubName = 'message';

    this.serverName = this.generateServerName();

    this.defaultPayloadMessage = {
      target: 'message',
      arguments: [
        // this.serverName,
        'Hello from server',
      ],
    };
  }

  @Post()
  async sendMessage() {
    // https://learn.microsoft.com/en-us/azure/azure-signalr/signalr-quickstart-rest-api#broadcast
    // https://learn.microsoft.com/en-us/azure/azure-signalr/swagger/signalr-data-plane-rest-v1#broadcast-a-message-to-all-clients-connected-to-target-hub
    await this.sendRequest('broadcast', this.hubName);
  }

  private async sendRequest(
    command: string,
    hubName: string,
    arg?: string,
  ): Promise<void> {
    let url: string | null = null;
    switch (command) {
      case 'user':
        url = this.getSendToUserUrl(hubName, arg);
        break;
      case 'group':
        url = this.getSendToGroupUrl(hubName, arg);
        break;
      case 'broadcast':
        url = this.getBroadcastUrl(hubName);
        break;
      default:
        console.error(`Can't recognize command ${command}`);
        break;
    }

    if (url) {
      try {
        const accessToken = this.generateAccessToken(url);
        const response = await this.buildAndSendRequest(url, accessToken);
        if (!response.ok) {
          console.error(
            `Sent error: ${response.status} ${
              response.statusText
            } ${await response.text()}`,
          );
        } else {
          console.log('Request sent successfully');
        }
      } catch (error) {
        console.error(`Error sending request: ${error.message}`);
      }
    }
  }

  private async buildAndSendRequest(
    url: string,
    accessToken: string,
  ): Promise<Response> {
    console.log({
      url,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(this.defaultPayloadMessage),
    });
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(this.defaultPayloadMessage),
    });
    return response;
  }

  private getEndpointUrlFromConnectionString(connectionString: string): string {
    console.log('Connection string:', connectionString);

    const regex = /Endpoint=([^;]+);/;
    const match = regex.exec(connectionString);
    const endpointUrl = match ? match[1] : null;
    if (!endpointUrl) {
      throw new Error('Invalid connection string');
    }

    console.log('Endpoint URL:', endpointUrl);

    return endpointUrl;
  }

  private getAccessKeyFromConnectionString(connectionString: string): string {
    const regex = /AccessKey=([^;]+);/;
    const match = regex.exec(connectionString);
    const accessKey = match ? match[1] : null;
    if (!accessKey) {
      throw new Error('Invalid connection string');
    }

    console.log('Access key:', accessKey);

    return accessKey;
  }

  private getSendToUserUrl(hubName: string, userId: string): string {
    return `${this.getBaseUrl(hubName)}/users/${userId}`;
  }

  private getSendToGroupUrl(hubName: string, group: string): string {
    return `${this.getBaseUrl(hubName)}/groups/${group}`;
  }

  private getBroadcastUrl(hubName: string): string {
    return this.getBaseUrl(hubName);
  }

  private getBaseUrl(hubName: string): string {
    return `${this.endpointUrl}/api/v1/hubs/${hubName.toLowerCase()}`;
  }

  private generateServerName(): string {
    return `server_${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Generates a JWT token for Azure SignalR Service REST API.
   * Alternatively, accessToken can be extracted from the response
   * of the Azure Function App negotiation function.
   *
   * @see https://learn.microsoft.com/en-us/azure/azure-signalr/signalr-reference-data-plane-rest-api#authentication-via-accesskey-in-azure-signalr-service
   * @see https://learn.microsoft.com/en-us/azure/azure-signalr/signalr-reference-data-plane-rest-api#implement-the-negotiation-endpoint
   */
  private generateAccessToken(audience: string, userId?: string): string {
    const claims = userId ? { sub: userId } : {};
    const payload = {
      ...claims,
      aud: audience,
      exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour expiration
    };
    console.log('JWT payload:', payload);

    return jwt.sign(payload, this.accessKey, {
      algorithm: 'HS256',
    });
  }
}
