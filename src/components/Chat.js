import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  connectToServer,
  disconnectFromServer,
  sendMessageToServer,
  sendNotificationToServer,
} from "./Server";
import api from "./Api";
import Cookies from "js-cookie";
import MessageDTO from "../dto/MessageDTO";
import NotificationDTO from "../dto/NotificationDTO";

import "bootstrap/dist/css/bootstrap.min.css";
import "../static/styles.css";
import { ReactComponent as ActiveUserIcon } from "../assets/images/chat-fill.svg";
import { ReactComponent as UserIcon } from "../assets/images/moon-stars-fill.svg";
import { ReactComponent as ChatIcon } from "../assets/images/chat-quote-fill.svg";
import {
  Card,
  CardBody,
  CardLink,
  CardSubtitle,
  CardText,
  CardTitle,
  Col,
  Row,
  Toast,
  ToastBody,
  ToastHeader,
} from "reactstrap";

const ChatView = () => {
  const [user, setUser] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [activeContacts, setActiveContacts] = useState([]);
  const [chatContact, setChatContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [notification, setNotification] = useState("");
  const [notificationText, setNotificationText] = useState("");

  const messagesEndRef = useRef(null);

  const navigate = useNavigate();

  const setChatId = (sender, receiver) => {
    let ids = [sender, receiver.username];
    ids.sort();
    return ids.join("_");
  };

  const fetchContacts = async () => {
    try {
      const response = await api.get("/api/contacts");
      const contacts = response.data.filter(
        (contact) => contact.username !== user
      );
      setContacts(contacts);
    } catch (error) {
      console.error("An error occurred while fetching contacts:", error);
    }
  };

  const fetchActiveContacts = async () => {
    try {
      const response = await api.get("/api/active-contacts");
      const activeContacts = response.data;
      setActiveContacts(activeContacts);
    } catch (error) {
      console.error("An error occurred while fetching active contacts:", error);
    }
  };

  const fetchMessages = async (chatId) => {
    try {
      const response = await api.get(`/api/messages/conversation/${chatId}`);
      setMessages(response.data);
    } catch (error) {
      console.error("An error occurred while fetching messages:", error);
    }
  };

  const onError = (err) => {
    console.log(err);
  };

  const onMessage = (response) => {
    var responseData = JSON.parse(response.body);
    setMessages((prevMessages) => [...prevMessages, responseData]);
  };

  const onNotification = (response) => {
    var responseData = JSON.parse(response.body);

    // Handle the online/offline type of notification
    if (responseData.type === "ONLINE") {
      // Add the user to the list of online users
      if (!activeContacts.includes(responseData.sender)) {
        setActiveContacts([...activeContacts, responseData.sender]);
      }
      setNotification(true);
      setNotificationText(`${responseData.sender} ${responseData.content}`);
    } else if (responseData.type === "OFFLINE") {
      // Remove the user from the list of online users
      setActiveContacts(
        activeContacts.filter((user) => user !== responseData.sender)
      );
      setNotification(true);
      setNotificationText(`${responseData.sender} is offline.`);
    } else if (responseData.type === "MESSAGE") {
      // Notify the user that they received a new message
      setNotification(true);
      setNotificationText(`${responseData.sender} ${responseData.content}`);
    }

    fetchActiveContacts();
  };

  // Get the logged-in user details from cookies
  useEffect(() => {
    const user = Cookies.get("loggedInUser");
    if (!user) {
      navigate("/login");
    }
    setUser(user);

    // Connect to server when component mounts
    connectToServer(user, onNotification, onMessage, onError);

    return () => {
      // Disconnect from server
      disconnectFromServer();
    };
  }, [navigate]);

  // Fetch the contacts list
  useEffect(() => {
    fetchContacts();
  }, [user]);

  // Fetch the active contacts
  useEffect(() => {
    if (contacts.length > 0) {
      fetchActiveContacts();
    }
  }, [contacts]);

  // Display the notifications
  useEffect(() => {
    if (notification !== false) {
      const timer = setTimeout(() => {
        setNotification(false);
      }, 5000);

      // Clear timeout if the component is unmounted
      return () => clearTimeout(timer);
    }
  }, [notification, notificationText]);

  // Fetch and display the messages for a selected conversation
  useEffect(() => {
    if (chatContact !== null) {
      let chatId = setChatId(user, chatContact);
      if (chatId !== null) {
        fetchMessages(chatId);
      }
    }
  }, [chatContact]);

  // Scroll to the bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Sets the default data input
  const [input, setInput] = useState({
    sender: user,
    recipient: "",
    content: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInput((prevState) => ({ ...prevState, [name]: value }));
  };

  const handleSend = () => {
    // Prepare the message data transfer object
    if (input.recipient !== "" && input.content !== "") {
      // Prepare the message data transfer object
      const message = new MessageDTO(user, input.recipient, input.content);
      // Prepare the notification data transfer object
      const messageNotification = new NotificationDTO(
        "MESSAGE",
        user,
        input.recipient,
        "sent you a message."
      );

      // Send the message to the server that sends it back to the corresponding user
      sendMessageToServer(message);

      // Send the notification to the server that sends it back to the corresponding user
      sendNotificationToServer(messageNotification);

      // Generate chatId
      let chatId = setChatId(user, chatContact);

      setInput({
        sender: user,
        recipient: "",
        content: "",
      });

      // After sending the message, fetch the updated list of messages.
      fetchMessages(chatId);
    }
  };

  return (
    <>
      {notification !== "" && !notificationText.includes(user) && (
        <div
          className={`p-1 rounded bg-docs-transparent-grid fade ${
            notification ? "show" : ""
          }`}
          style={{
            position: "fixed",
            top: "30px",
            right: "30px",
            zIndex: "10000",
          }}
        >
          <Toast>
            <ToastHeader>Notification</ToastHeader>
            <ToastBody>{notificationText}</ToastBody>
          </Toast>
        </div>
      )}
      <Row className="m-5">
        <Col className="mt-4" sm="4">
          <Card body className="card-custom" style={{ height: "80vh" }}>
            <CardTitle tag="h5">Messenger</CardTitle>
            <CardSubtitle className="mb-3 text-muted" tag="h6">
              Contacts
            </CardSubtitle>
            <div
              className="subcard-wrapper-custom"
              style={{ overflowY: "auto", maxHeight: "80vh" }}
            >
              <Col sm="12">
                {contacts.map((contact, index) => (
                  <Card
                    key={index}
                    body
                    className="subcard-custom mx-1 my-2"
                    onClick={() => setChatContact(contact)}
                  >
                    <Row>
                      <Col xs="8">
                        <div>
                          <CardTitle className="mb-1" tag="h6">
                            {contact.firstName} {contact.lastName}
                          </CardTitle>
                          <CardText className="small-text">
                            {contact.username}
                          </CardText>
                        </div>
                      </Col>
                      <Col xs="4" className="logo-container">
                        <div>
                          <CardTitle className="mb-1" tag="h6">
                            {activeContacts.includes(contact.username) ? (
                              <ActiveUserIcon
                                style={{
                                  width: "12px",
                                  height: "12px",
                                  color: "green",
                                }}
                              />
                            ) : (
                              <UserIcon
                                style={{
                                  width: "12px",
                                  height: "12px",
                                  color: "purple",
                                }}
                              />
                            )}
                          </CardTitle>
                        </div>
                      </Col>
                    </Row>
                  </Card>
                ))}
              </Col>
            </div>
          </Card>
        </Col>
        <Col className="mt-4" sm="8">
          <Card body className="card-custom" style={{ height: "80vh" }}>
            <CardTitle tag="h5">
              {chatContact
                ? `${chatContact.firstName} ${chatContact.lastName}`
                : "Pick conversation"}
            </CardTitle>
            {chatContact && (
              <CardSubtitle className="mb-2 text-muted" tag="h6">
                {activeContacts.includes(chatContact.username)
                  ? "Online"
                  : "Offline"}
              </CardSubtitle>
            )}
            <CardBody style={{ overflowY: "auto", maxHeight: "60vh" }}>
              {chatContact ? (
                messages.length > 0 ? (
                  <div className="message-list">
                    {messages.map((message, index) => (
                      <Card
                        key={index}
                        className={`mb-2 message-card ${
                          message.sender === user ? "message-sent" : "message-received"
                        }`}
                      >
                        <CardBody>
                          <p>{message.content}</p>
                        </CardBody>
                      </Card>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      height: "100%",
                      color: "gray",
                    }}
                  >
                    <p>
                      Don't be shy, say hi to <b>{chatContact.username}</b>! 👋
                    </p>
                  </div>
                )
              ) : (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100%",
                    color: "gray",
                    opacity: "0.1",
                  }}
                >
                  <ChatIcon style={{ width: "100px", height: "100px" }} />
                </div>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>
      <div hidden>
        <input
          type="text"
          name="recipient"
          value={input.recipient}
          onChange={handleInputChange}
          placeholder="Type a recipient..."
        />
        <input
          type="text"
          name="content"
          value={input.content}
          onChange={handleInputChange}
          placeholder="Type a message..."
        />
        <button onClick={handleSend}>Send</button>
      </div>
      <div hidden>
        {messages.map((message, index) => (
          <div key={index}>
            <p>Sender: {message.sender}</p>
            <p>Message: {message.content}</p>
          </div>
        ))}
      </div>
    </>
  );
};

export default ChatView;
