const express = require("express");
const axios = require("axios");
const url = require("url");
const { query } = require("express");
require("dotenv/config");

const app = express();

app.use("/test", async (req, res) => {
  const code = req.query.code;

  let data = {
    code,
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
  };

  let formBody = [];

  for (let key in data) {
    const encodedKey = encodeURIComponent(key);
    const encodedValue = encodeURIComponent(data[key]);
    formBody.push(encodedKey + "=" + encodedValue);
  }

  data = formBody.join("&");
  let response;
  response = await axios.post("https://slack.com/api/oauth.v2.access", data, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
    },
  });

  const { access_token, app_id } = response.data;

  response = await axios.get("https://slack.com/api/conversations.list", {
    params: {
      token: access_token,
    },
  });

  const channel_id = response.data.channels[0].id;

  response = await axios.post(
    "https://slack.com/api/conversations.invite",
    {
      channel: channel_id,
      users: app_id,
    },
    {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    }
  );

  return res.redirect(
    url.format({
      pathname: "/send-message",
      query: {
        channel_id,
        access_token,
      },
    })
  );
});

app.use("/send-message", async (req, res) => {
  const { channel_id, access_token } = req.query;
  const response = await axios.post(
    "https://slack.com/api/chat.postMessage",
    {
      channel: channel_id,
      text: "test node :)",
    },
    {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    }
  );
  return res.json(response.data);
});

app.use("/slack", (req, res) => {
  return res.send(`
  <a href="https://slack.com/oauth/v2/authorize?client_id=${process.env.CLIENT_ID}&scope=channels:read,chat:write,channels:join,channels:manage,groups:write,im:write,mpim:write&user_scope="><img alt="Add to Slack" height="40" width="139" src="https://platform.slack-edge.com/img/add_to_slack.png" srcSet="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x" /></a>
  `);
});

app.listen(3000);
