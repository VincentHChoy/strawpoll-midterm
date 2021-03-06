/*
 * All routes for Users are defined here
 * Since this file is loaded in server.js into api/users,
 *   these routes are mounted onto /users
 * See: https://expressjs.com/en/guide/using-middleware.html#middleware.router
 */

// Mailgun setup
require("dotenv").config();
const mailgun = require("mailgun-js");
const DOMAIN = process.env.MAILGUN_DOMAIN;
const mg = mailgun({
  apiKey: process.env.API_KEY_MAILGUN,
  domain: DOMAIN,
});

// Database
const database = require("../lib/db");

module.exports = (router) => {
  // Home page to begin the poll creation
  router.get("/poll", (req, res) => {
    res.render("index");
  });

  // Redirections to /poll or homepage
  router.get("/", (req, res) => {
    res.redirect("/poll");
  });

  router.get("/home", (req, res) => {
    res.redirect("/poll");
  });

  // Create a new poll
  router.post("/poll", (req, res) => {
    const { email, question } = req.body;

    if (email === "" || question === "") {
      const message = {
        text: "Invalid data. Please enter the email address and a question!",
      };
      res.status(400).render("index", message);
      return;
    }

    database
      .createPoll(email, question)
      .then((poll) => {
        if (!poll) {
          res.send({ error: "Couldn't create a poll!" });
          return;
        }
        const id = poll.id;
        res.redirect(`/poll/${id}/options`);
      })
      .catch((e) => res.send(e));
  });

  // Display poll question for new poll
  router.get("/poll/:id/options", (req, res) => {
    const { id } = req.params;

    if (!id) {
      res.status(400).render("index", ["Invalid data"]);
      return;
    }

    database
      .getPollQuestion(id)
      .then((poll) => {
        if (!poll) {
          res.send({ error: "Couldn't get question!!" });
          return;
        }

        const question = poll.question_text;
        const templateVars = { id, question };

        res.render("options", templateVars);
      })
      .catch((e) => res.send(e));
  });

  // Accept options for new poll
  router.post("/poll/:id/options", (req, res) => {
    const { option0, option1, option2, option3 } = req.body;
    const { id } = req.params;
    if (option0 === "" || option1 === "" || option2 === "" || option3 === "") {
      res.status(400).render("index", ["Invalid data"]);
      return;
    }

    database
      .createOptions(id, option0)
      .then((result) => {
        if (!result) {
          res.send({ error: "Couldn't create poll option1!" });
          return;
        }
        database
          .createOptions(id, option1)
          .then((result) => {
            if (!result) {
              res.send({ error: "Couldn't create poll option2!" });
              return;
            }
            database
              .createOptions(id, option2)
              .then((result) => {
                if (!result) {
                  res.send({ error: "Couldn't create poll option3!" });
                  return;
                }
                database
                  .createOptions(id, option3)
                  .then((result) => {
                    if (!result) {
                      res.send({ error: "Couldn't create poll option4!" });
                      return;
                    }

                    const { owner_email } = result;
                    const shareLink = `/poll/${id}`;

                    // Trigger email to poll creator
                    const emailData = {
                      from: "Sneha Mahajan <sneh.km@gmail.com>",
                      to: owner_email,
                      subject: `DecisionMaker - You created a new poll and id is ${id}!!`,
                      text: `Share this poll with your friends! Link: ${shareLink}`,
                    };
                    sendEmail(emailData);
                    res.redirect(shareLink);
                  })
                  .catch((e) => res.send(e));
              })
              .catch((e) => res.send(e));
          })
          .catch((e) => res.send(e));
      })
      .catch((e) => res.send(e));
  });

  // Show a poll and options
  router.get("/poll/:id", (req, res) => {
    const { id } = req.params;

    database
      .showPoll(id)
      .then((result) => {
        const question = result[0].question_text;
        const options = result.map((element) => {
          return element.option;
        });
        const templateVars = {
          id,
          question,
          options,
        };
        res.render("vote", templateVars);
      })
      .catch((e) => {
        console.error(e);
        res.send(e);
      });
  });

  // Vote on a poll
  router.post("/poll/:id", (req, res) => {
    const { id } = req.params;
    const { votes } = req.body;

    if (!votes) {
      res.status(400).render("index", ["No poll votes received!"]);
      return;
    }

    const { options } = votes;
    const rank1 = options[0].points;
    const rank2 = options[1].points;
    const rank3 = options[2].points;
    const rank4 = options[3].points;

    database
      .voteOnPoll(id, rank1, rank2, rank3, rank4)
      .then((result) => {
        const { owner_email } = result;
        // Trigger email to poll creator
        const emailData = {
          from: "Strawpoll <hello@strawpoll.com>",
          to: owner_email,
          subject: `Someone voted on your poll ${id}!!`,
          text: `Someone voted on your poll ${id}!!`,
        };
        sendEmail(emailData);
        res.redirect(`/poll/${id}/results`);
      })
      .catch((e) => {
        console.error(e);
        res.send(e);
      });
  });

  // Show results of a poll, gets the id and question
  router.get("/poll/:id/results", (req, res) => {
    const { id } = req.params;

    database
      .getPollQuestion(id)
      .then((poll) => {
        if (!poll) {
          res.send({ error: "Couldn't get question!!" });
          return;
        }

        const question = poll.question_text;
        const templateVars = { id, question };

        res.render("results", templateVars);
      })
      .catch((e) => res.send(e));
  });

  // Helper function to send emails via mailgun
  const sendEmail = (emailData) => {
    mg.messages().send(emailData, function (error, body) {
      if (!body.id || error) {
        console.log("Email unsuccessful! Use a valid email address.", error);
        return false;
      }
      console.log(`An email was just sent to: ${emailData.to}`, body);
      return true;
    });
    return;
  };

  return router;
};
