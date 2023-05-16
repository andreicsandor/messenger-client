import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

let stompClient = null;

const connectToServer = (user, onMessage, onNotification, onError) => {
  // Create new instance of Client
  stompClient = new Client({
    webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
    onConnect: () => {
      console.log("Connected");
      // Subscribe to new messages channel & fetch automatically new messages
      stompClient.subscribe("/user/" + user + "/messages", onMessage);
      // Subscribe to new notifications channel & fetch automatically new notifications
      stompClient.subscribe("/user/" + user + "/notifications", onNotification);
    },
    onStompError: onError,
  });

  stompClient.activate();
};

const disconnectFromServer = () => {
  if (stompClient) {
    stompClient.deactivate();
    stompClient = null;
  }
};

const sendMessageToServer = (message) => {
  console.log(message);
  if (stompClient) {
    stompClient.publish({
      destination: "/app/chat",
      body: JSON.stringify(message),
    });
  }
};

export { connectToServer, disconnectFromServer, sendMessageToServer };
