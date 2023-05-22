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
import { ReactComponent as NotificationIcon } from "../assets/images/circle-fill.svg";
import {
  Button,
  Card,
  CardBody,
  CardSubtitle,
  CardText,
  CardTitle,
  Col,
  Input,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
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
  const chatContactRef = useRef(null);

  const [pingModal, setPingModal] = useState(false);
  const [pingModalText, setPingModalText] = useState("");

  const navigate = useNavigate();

  const setRoomId = (sender, receiver) => {
    let ids = [sender, receiver.username];
    ids.sort();
    return ids.join("_");
  };

  const fetchContacts = async () => {
    try {
      const user = Cookies.get("loggedInUser");
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
      console.log(activeContacts);
      setActiveContacts(activeContacts);
    } catch (error) {
      console.error("An error occurred while fetching active contacts:", error);
    }
  };

  const fetchMessages = async (roomId) => {
    try {
      const response = await api.get(`/api/messages/conversation/${roomId}`);
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

    if (
      chatContactRef.current &&
      (responseData.sender === chatContactRef.current.username ||
        responseData.recipient === chatContactRef.current.username)
    ) {
      setMessages((prevMessages) => [...prevMessages, responseData]);
    }
  };

  const onNotification = async (response) => {
    var responseData = JSON.parse(response.body);

    // Handle the online/offline type of notification
    if (responseData.type === "ONLINE") {
      // Add the user to the list of online users
      setActiveContacts((prevActiveContacts) => [
        ...prevActiveContacts,
        responseData.sender,
      ]);
      setNotification(true);
      setNotificationText(`${responseData.sender} ${responseData.content}`);
    } else if (responseData.type === "OFFLINE") {
      // Remove the user from the list of online users
      setActiveContacts((prevActiveContacts) =>
        prevActiveContacts.filter((user) => user !== responseData.sender)
      );
      setNotification(true);
      setNotificationText(`${responseData.sender} ${responseData.content}`);
    } else if (responseData.type === "MESSAGE") {
      // Notify the user that they received a new message only if it's not from the active chat contact
      if (responseData.sender !== chatContactRef.current?.username) {
        setNotification(true);
        setNotificationText(`${responseData.sender} ${responseData.content}`);
      }
    } else if (responseData.type === "PING") {
      // Open a full screen modal when the user receives a ping
      setPingModal(true);
      setPingModalText(`${responseData.sender} has pinged you!`);
    }
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
      let roomId = setRoomId(user, chatContact);
      if (roomId !== null) {
        fetchMessages(roomId);
      }
      setInput((prevState) => ({
        ...prevState,
        recipient: chatContact.username,
      }));
    }
  }, [chatContact]);

  // Scroll to the bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Keep latest selected chat
  useEffect(() => {
    chatContactRef.current = chatContact;
  }, [chatContact]);

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
      setMessages((prevMessages) => [...prevMessages, message]);

      // Send the notification to the server that sends it back to the corresponding user
      sendNotificationToServer(messageNotification);

      // Generate roomId
      let roomId = setRoomId(user, chatContact);

      setInput((prevState) => ({
        ...prevState,
        content: "", // Clear the content field
      }));
    }
  };

  const handlePing = () => {
    // Prepare the notification data transfer object
    const pingNotification = new NotificationDTO(
      "PING",
      user,
      chatContact.username,
      "has pinged you!"
    );

    // Send the notification to the server that sends it back to the corresponding user
    sendNotificationToServer(pingNotification);
  };

  const handleLeave = () => {
    // Prepare the notification data transfer object
    const offlineNotification = new NotificationDTO(
      "OFFLINE",
      user,
      "",
      "is offline."
    );
    // Send the offline status notification to the server
    sendNotificationToServer(offlineNotification);

    setTimeout(() => {
      navigate("/logout");
    }, 1000);
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
            <Row>
              <Col xs="8">
                <CardTitle tag="h5">Messenger</CardTitle>
              </Col>

              <Col
                xs="4"
                className="d-flex align-items-center justify-content-end"
              >
                <Button
                  color="light"
                  size="sm"
                  onClick={handleLeave}
                  style={{ fontWeight: 500 }}
                >
                  Leave
                </Button>
              </Col>
            </Row>
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
                            <NotificationIcon
                              className="mx-1"
                              style={{
                                width: "8px",
                                height: "8px",
                                color: "red",
                              }}
                            />
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
            <Row>
              <Col xs="8">
                <CardTitle tag="h5">
                  {chatContact
                    ? `${chatContact.firstName} ${chatContact.lastName}`
                    : "Pick conversation"}
                </CardTitle>
              </Col>
              {chatContact && (
                <Col
                  xs="4"
                  className="d-flex align-items-center justify-content-end"
                >
                  <Button
                    color="light"
                    size="sm"
                    onClick={handlePing}
                    style={{ fontWeight: 500 }}
                  >
                    Ping
                  </Button>
                </Col>
              )}
            </Row>
            {chatContact && (
              <CardSubtitle className="mb-2 text-muted" tag="h6">
                {activeContacts.includes(chatContact.username)
                  ? "Online"
                  : "Offline"}
              </CardSubtitle>
            )}

            <CardBody
              className="mb-2"
              style={{ overflowY: "auto", maxHeight: "70vh" }}
            >
              {chatContact ? (
                messages.length > 0 ? (
                  <div className="message-list">
                    {messages.map((message, index) => (
                      <Card
                        key={index}
                        className={`mb-2 message-card ${
                          message.sender === user
                            ? "message-sent"
                            : "message-received"
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
                      Don't be shy, say hi to <b>{chatContact.firstName}</b>! 👋
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
            <div>
              {chatContact && (
                <div>
                  <Input
                    hidden
                    type="text"
                    name="recipient"
                    value={input.recipient}
                    onChange={handleInputChange}
                    placeholder="Type a recipient..."
                  />
                  <Row>
                    <Col xs="1"></Col>
                    <Col xs="9">
                      <Input
                        className="input-custom"
                        bsSize="sm"
                        type="text"
                        name="content"
                        value={input.content}
                        onChange={handleInputChange}
                        placeholder="Message"
                      />
                    </Col>
                    <Col xs="2">
                      <Button
                        color="dark"
                        size="sm"
                        onClick={handleSend}
                        style={{ fontWeight: "bold" }}
                      >
                        Send
                      </Button>
                    </Col>
                  </Row>
                </div>
              )}
            </div>
          </Card>
        </Col>
      </Row>
      <Modal isOpen={pingModal}>
        <ModalHeader>Ping Notification</ModalHeader>
        <ModalBody>{pingModalText}</ModalBody>
        <ModalFooter>
          <Button
            color="dark"
            size="sm"
            style={{ fontWeight: "bold", width: "25%" }}
            onClick={() => setPingModal(false)}
          >
            Okay
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
};

export default ChatView;
