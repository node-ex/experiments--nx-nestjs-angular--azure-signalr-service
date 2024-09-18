import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';

@Component({
  standalone: true,
  imports: [RouterModule],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  title = 'app-angular-1';
  private hubConnection!: HubConnection;

  constructor() {
    console.log('PUBLIC_GREETING', process.env.PUBLIC_GREETING);
  }

  async ngOnInit() {
    const azureFunctionAppUrl = process.env.PUBLIC_AZURE_FUNCTION_APP_URL;

    this.hubConnection = new HubConnectionBuilder()
      .withUrl(azureFunctionAppUrl)
      .build();

    await this.hubConnection
      .start()
      .then(() => {
        console.log('Connection started');
      })
      .catch((err: unknown) => {
        const error = err as Error;
        console.log('Error while starting connection: ' + error.message);
      });

    this.hubConnection.on('message', (message) => {
      console.log('Received message:', JSON.stringify(message, null, 2));
    });
  }

  async sendMessage(message: any) {
    await this.hubConnection
      .invoke('message', message)
      .catch((err: unknown) => {
        const error = err as Error;
        console.error('Error while sending message: ', error.message);
      });
  }
}
