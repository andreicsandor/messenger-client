class NotificationDTO {
    constructor(type, sender, recipient, content) {
      this.type = type;
      this.sender = sender;
      this.recipient = recipient;
      this.content = content;
    }
}

export default NotificationDTO;