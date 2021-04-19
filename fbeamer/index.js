'use strict'
const crypto = require('crypto');
const axios = require('axios');

class FBeamer {
  constructor({ pageAccessToken, verifyToken, appSecret }) {
    try {
      if (pageAccessToken && verifyToken && appSecret) {
        this.pageAccessToken = pageAccessToken;
        this.verifyToken = verifyToken;
        this.appSecret = appSecret;
      }
      else {
        throw "One or more tokens/credentials are missing!";
      }
    }
    catch (error) {
      console.log(error);
    }
  }

  registerHook(request, response) {
    const params = request.query;
    const mode = params['hub.mode'], token = params['hub.verify_token'], challenge = params['hub.challenge'];
    try {
      if ((mode && this.verifyToken) && mode === 'subscribe' && token === this.verifyToken) {
        console.log("Webhook registered!");
        return response.send(challenge);
      }
      else {
        console.log("Could not register webhook!");
        return response.sendStatus(400);
      }
    }
    catch (error) {
      console.log(error);
    }
  }

  verifySignature(request, response, buffer) {
    return (request, response, buffer) => {
      if (request.method === 'POST') {
        try {
          const signature = request.headers['x-hub-signature'].substr(5);
          const hash = crypto.createHmac('sha1', this.appSecret).update(buffer, 'utf-8').digest('hex');
          if (signature !== hash)
            throw 'Error verifying x hub signature';
        }
        catch (error) {
          console.log(error);
        }
      }
    }
  }

  incoming(request, response, callback) {
    response.sendStatus(200);
    // Extract the body of the POST request
    if (request.body.object === 'page' && request.body.entry) {
      const data = request.body;
      const messageObj = data.entry;
      if (!messageObj[0].messaging)
        console.log("Error message");
      else return callback(messageObj[0].messaging);
    }
  }

  messageHandler(obj) {
    const sender = obj[0].sender.id;
    const message = obj[0].message.text;
    const obj2 = {
      sender,
      type: 'text',
      content: message
    }
    return obj2;
  }

  sendMessage(msgType, id, text) {
    const payload_message = {
      "messaging_type": msgType,
      "recipient": {
        "id": id
      },
      "message": {
        "text": text
      }
    };
    return new Promise((resolve, reject) => {
      axios({
        method: 'post',
        url: `https://graph.facebook.com/v6.0/me/messages?access_token=${this.pageAccessToken}`,
        headers: { 'Content-Type': 'application/json' },
        data: payload_message
      }, (error, response, body) => {
        if (!error && response.statusCode === 200) {
          resolve({
            messageId: body.message_id
          });
        } else {
          reject(error);
        }
      });
    });
  }

  sendMessageWithReplies(msgType, id, text, replies) {
    const payload_message_replies = {
      "messaging_type": msgType,
      "recipient": {
        "id": id
      },
      "message": {
        "text": text,
        "quick_replies": replies
      }
    };
    return new Promise((resolve, reject) => {
      axios({
        method: 'post',
        url: `https://graph.facebook.com/v6.0/me/messages?access_token=${this.pageAccessToken}`,
        headers: { 'Content-Type': 'application/json' },
        data: payload_message_replies
      }, (error, response, body) => {
        if (!error && response.statusCode === 200) {
          resolve({
            messageId: body.message_id
          });
        } else {
          reject(error);
        }
      });
    });
  }

  sendMedia(id, url) {
    const payload_media = {
      "recipient": {
        "id": id
      },
      "message":{
        "attachment": {
          "type": "template",
          "payload": {
            "template_type": "media",
            "elements": [
              {
                "media_type": "image",
                "attachment_id": url
              }
            ]
          }
        }   
      }
    };
    return new Promise((resolve, reject) => {
      axios({
        method: 'post',
        url: `https://graph.facebook.com/v6.0/me/messages?access_token=${this.pageAccessToken}`,
        headers: { 'Content-Type': 'application/json' },
        data: payload_media
      }, (error, response, body) => {
        if (!error && response.statusCode === 200) {
          resolve({
            messageId: body.message_id
          });
        } else {
          reject(error);
        }
      });
    });
  }
}

module.exports = FBeamer;