import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  connectToServer,
  disconnectFromServer,
  sendMessageToServer,
} from "./Server";
import api from "./Api";
import Cookies from "js-cookie";
import MessageDTO from "../dto/MessageDTO";
import NotificationDTO from "../dto/NotificationDTO";

import "bootstrap/dist/css/bootstrap.min.css";
import "../static/styles.css";
import { ReactComponent as ActiveUserIcon } from "../assets/images/chat-fill.svg";
import { ReactComponent as UserIcon } from "../assets/images/moon-stars-fill.svg";
import {
  Card,
  CardBody,
  CardLink,
  CardSubtitle,
  CardText,
  CardTitle,
  Col,
  Row,
} from "reactstrap";

const ChatView = () => {
  const [user, setUser] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [activeContacts, setActiveContacts] = useState([]);
  const [chatContact, setChatContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const navigate = useNavigate();

  // Show error in console
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
    } else if (responseData.type === "OFFLINE") {
      // Remove the user from the list of online users
      setActiveContacts(
        activeContacts.filter((user) => user !== responseData.sender)
      );
    }
  };

  // Gets the logged-in user details from cookies
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

  useEffect(() => {
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

    fetchContacts();
  }, [user]);

  useEffect(() => {
    const fetchActiveContacts = async () => {
      try {
        const response = await api.get("/api/active-contacts");
        const activeContacts = response.data;
        setActiveContacts(activeContacts);
      } catch (error) {
        console.error(
          "An error occurred while fetching active contacts:",
          error
        );
      }
    };

    if (contacts.length > 0) {
      fetchActiveContacts();
    }
  }, [contacts]);

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
      const message = new MessageDTO(user, input.recipient, input.content);

      // Send the message to the server that sends it back to the corresponding user
      sendMessageToServer(message);

      setInput({
        sender: user,
        recipient: "",
        content: "",
      });
    }
  };

  return (
    <>
      <div>
        <h3>New message</h3>
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
      <div>
        {messages.map((message, index) => (
          <div key={index}>
            <p>Sender: {message.sender}</p>
            <p>Message: {message.content}</p>
          </div>
        ))}
      </div>

      <Row className="m-5">
        <Col sm="4">
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
                                style={{ width: "12px", height: "12px", color: "green" }}
                              />
                            ) : (
                              <UserIcon
                                style={{ width: "12px", height: "12px" }}
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
        <Col sm="8">
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

            <div
              className="subcard-wrapper-custom"
              style={{ overflowY: "auto", maxHeight: "80vh" }}
            >
              <Col sm="12"></Col>
            </div>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default ChatView;
