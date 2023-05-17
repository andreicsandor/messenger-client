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

import "bootstrap/dist/css/bootstrap.min.css";
import "../static/styles.css";
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
  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const navigate = useNavigate();

  // Show error in console
  const onError = (err) => {
    console.log(err);
  };

  const onMessage = (response) => {
    console.log(response);
    var responseData = JSON.parse(response.body);
    setMessages((prevMessages) => [...prevMessages, responseData]);
  };

  const onNotification = (response) => {
    console.log(response);
    var responseData = JSON.parse(response.body);
    setNotifications((prevNotifications) => [
      ...prevNotifications,
      responseData,
    ]);
  };

  // Gets the logged-in user details from cookies
  useEffect(() => {
    const user = Cookies.get("loggedInUser");
    if (!user) {
      navigate("/login");
    }
    setUser(user);

    // Connect to server when component mounts
    connectToServer(user, onMessage, onNotification, onError);

    return () => {
      // Disconenct from server
      disconnectFromServer();
    };
  }, [navigate]);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const response = await api.get("/api/contacts");
        setContacts(response.data);
      } catch (error) {
        console.error("An error occurred while fetching contacts:", error);
      }
    };

    fetchContacts();
  }, []);

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
    <Card
      body
      className="card-custom"
      style={{ height: "80vh" }}
    >
      <CardTitle tag="h5">Messenger</CardTitle>
      <CardSubtitle className="mb-3 text-muted" tag="h6">
        Contacts
      </CardSubtitle>
      <div
        className="subcard-wrapper-custom"
        style={{ overflowY: "auto", maxHeight: "80vh" }}
      >
        <Col sm="12">
          {contacts.map((contact) => (
            <Card body className="subcard-custom mx-1 my-2" onClick={() => setActiveContact(contact)}>
              <CardTitle className="mb-1" tag="h6">
                {contact.firstName} {contact.lastName}
              </CardTitle>
              <CardText className="small-text">
                {contact.username}
              </CardText>
            </Card>
          ))}
        </Col>
      </div>
    </Card>
  </Col>
  <Col sm="8">
    <Card
      body
      className="card-custom"
      style={{ height: "80vh" }}
    >
      <CardTitle tag="h5">{activeContact ? `${activeContact.firstName} ${activeContact.lastName}` : 'Pick conversation'}</CardTitle>
      <CardSubtitle className="mb-2 text-muted" tag="h6">
        Online/Offline
      </CardSubtitle>
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
