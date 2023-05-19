import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

let stompClient = null;

const connectToJoinServer = (user, onError) => {
  // Create new instance of Client
  stompClient = new Client({
    webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
    onConnect: () => {
      console.log("Connected");
    },
    onStompError: onError,
  });

  stompClient.activate();
};

const connectToServer = (user, onNotification, onMessage, onError) => {
  // Create new instance of Client
  stompClient = new Client({
    webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
    onConnect: () => {
      console.log("Connected");
      // Subscribe to new messages channel & fetch automatically new messages
      stompClient.subscribe("/user/" + user + "/messages", onMessage);
      // Subscribe to new message notifications channel
      stompClient.subscribe("/user/" + user + "/notifications", onNotification);
      // Subscribe to notifications channel 
      stompClient.subscribe("/public/notifications", onNotification);
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
    if (stompClient.connected) {
      stompClient.publish({
        destination: "/app/chat",
        body: JSON.stringify(message),
      });
    } else {
      setTimeout(() => sendMessageToServer(message), 1000);
    }
  }
};

const sendNotificationToServer = (notification) => {
  console.log(notification);
  if (stompClient) {
    if (stompClient.connected) {
      stompClient.publish({
        destination: "/app/notifications",
        body: JSON.stringify(notification),
      });
    } else {
      setTimeout(() => sendNotificationToServer(notification), 1000);
    }
  }
};

export { connectToJoinServer, connectToServer, disconnectFromServer, sendMessageToServer, sendNotificationToServer };
