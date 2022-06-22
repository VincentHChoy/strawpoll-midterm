/*
 * All routes for Users are defined here
 * Since this file is loaded in server.js into api/users,
 *   these routes are mounted onto /users
 * See: https://expressjs.com/en/guide/using-middleware.html#middleware.router
 */

const express = require("express");
const router = express.Router();

module.exports = (database) => {

  // Home page to begin the poll creation
  router.get("/", (req, res) => {
    res.render("index");
  });

  // Submit new pole data and links created.
  // Poll data includes question and options.
  // Links contain new links.
  router.post("/poll", (req, res) => {
    const pollData = req.body;

    const shareID = generateUniqueRandomPollId();
    const adminID = generateUniqueRandomPollId();
    const links = {
      shareLink: `/poll:${shareID}`,
      adminLink: `/poll:${adminID}`,
    };

    database
      .addPoll(pollData, links)
      .then((poll) => {
        if (!poll) {
          res.send({ error: "error" });
          return;
        }
        req.session.userId = poll.id;
        res.render("vote", links);
      })
      .catch((e) => res.send(e));
  });

  // Get poll data and display on vote page.
  // Result object from dB will have "poll question" and "options"
  // to render
  router.get("/poll:shareID", (req, res) => {
    const shareID = req.params.shareID;
    database
      .getPollData(shareID)
      .then((result) => res.render("vote", result))
      .catch((e) => {
        console.error(e);
        res.send(e);
      });
  });

  // Post poll data and display results page
  // Result object from dB will have "poll question", "legend" &
  // data for pie chart.
  router.post("/poll:shareID", (req, res) => {
    const shareID = req.params.shareID;
    database
      .saveResults(shareID)
      .then((result) => res.render("result", result))
      .catch((e) => {
        console.error(e);
        res.send(e);
      });
  });

  // Get results of a poll and display results page
  // Result object from dB will have "poll question", "legend" &
  // data for pie chart.
  router.get("/poll:shareID/results", (req, res) => {
    const shareID = req.params.adminID;
    database
      .getResults(shareID)
      .then((result) => res.render("result", result))
      .catch((e) => {
        console.error(e);
        res.send(e);
      });
  });



  // Helper funciton to generate random ID for links
  const generateUniqueRandomPollId = () => {
    let id = "";
    let strLen = 6;
    const chars =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    for (let i = 0; i < strLen; i++) {
      const randIndex = Math.floor(Math.random() * chars.length);
      id = id.concat(chars[randIndex]);
    }
    return id;
  };

  return router;
};
