import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Container,
  Col,
  Form,
  FormGroup,
  Input,
  Row,
} from "reactstrap";
import api from "./Api";
import Cookies from "js-cookie";

const LoginView = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const loggedInUser = Cookies.get("loggedInUser");

    if (loggedInUser)
      navigate("/chats");

  }, [navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    console.log(username);
    console.log(password);
    try {
      const response = await api.post("/api/login", {
        username: username,
        password: password,
      });
      if (response.status === 200) {
        Cookies.set("loggedInUser", response.data.username);

        navigate("/chat");
      } else {
        setErrorMessage("Log in failed.");
      }
    } catch (error) {
      if (
        error.response &&
        (error.response.status === 400 || error.response.status === 401)
      ) {
        setErrorMessage("Invalid username or password.");
      } else {
        console.error("An unknown error occurred:", error);
        navigate("/login");
      }
    }
  };

  return (
    <>
      <div style={{ margin: "100px" }}></div>
      <Container className="my-5">
        <Row>
          <Col>
            <h1 className="mb-3 display-4 text-center">Welcome to Messenger</h1>
          </Col>
        </Row>

        <Row className="justify-content-center">
          <Col md={4}>
            <Form onSubmit={handleSubmit}>
              <FormGroup>
                <Input
                  type="text"
                  name="username"
                  id="username"
                  placeholder="Username"
                  bsSize="lg"
                  className="mb-3"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                />
              </FormGroup>
              <FormGroup>
                <Input
                  type="password"
                  name="password"
                  id="password"
                  placeholder="Password"
                  bsSize="lg"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  style={{ marginBottom: "3rem" }}
                />
              </FormGroup>

              <Button color="dark" size="lg" block>
                Login
              </Button>

              {errorMessage && (
                <div className="mt-5 mb-5 fw-bold error-message">
                  {errorMessage}
                </div>
              )}
            </Form>
          </Col>
        </Row>
      </Container>
    </>
  );
};

const LogoutView = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const loggedInUser = Cookies.get("loggedInUser");

    if (loggedInUser) {
      // Remove session cookies
      Cookies.remove("loggedInUser");

      // Redirect to login page
      navigate("/login");
    } else {
      navigate("/login");
    }
  }, [navigate]);

  return null;
};

export { LoginView, LogoutView };