const express = require("express");
const axios = require("axios");
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

  const access_token = response.data.access_token;

  response = await axios.get("https://slack.com/api/conversations.list", {
    params: {
      token: access_token,
    },
  });

  const channel_id = response.data.channels[0].id;

  response = await axios.post(
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

  console.log(response.data);

  return res.send("teste :)");
});

app.use("/slack", (req, res) => {
  return res.send(`
  <a href="https://slack.com/oauth/v2/authorize?client_id=${process.env.CLIENT_ID}&scope=channels:read,chat:write,channels:join&user_scope="><img alt="Add to Slack" height="40" width="139" src="https://platform.slack-edge.com/img/add_to_slack.png" srcSet="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x" /></a>
  `);
});

app.listen(3000);
