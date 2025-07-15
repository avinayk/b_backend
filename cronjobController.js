const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const moment = require("moment-timezone");
const db = require("../../db");
const nodemailer = require("nodemailer");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const { format } = require("date-fns");
const fs = require("fs");
const path = require("path");
const mammoth = require("mammoth");
const PizZip = require("pizzip");
const Docxtemplater = require("docxtemplater");
const mysql = require("mysql2/promise"); // 👈 only used in this API
const cron = require("node-cron");
const puppeteer = require("puppeteer");

const pdfParse = require("pdf-parse");
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const Stripe = require("stripe");
const stripe = new Stripe(
  "sk_test_51RUJzWAx6rm2q3pyUl86ZMypACukdO7IsZ0AbsWOcJqg9xWGccwcQwbQvfCaxQniDCWzNg7z2p4rZS1u4mmDDyou00DM7rK8eY"
);
const upload = require("../../middlewares/uploadMiddleware");

require("dotenv").config();
//Email Detail
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

//All User subscription related
exports.getAllActiveSubscriptions = async () => {
  try {
    db.query(
      `SELECT 
        u.id AS user_id, u.email, u.company_name,
        (
          SELECT MAX(end_date)
          FROM usersubscriptiondataroomone_time
          WHERE user_id = u.id
        ) AS dataroom_end,
        (
          SELECT MAX(end_date)
          FROM userinvestorreporting_subscription
          WHERE user_id = u.id
        ) AS report_end
      FROM company u`,
      async (err, results) => {
        if (err) {
          console.error("DB query failed:", err);
          return;
        }

        const today = new Date();

        for (let row of results) {
          const userId = row.user_id;
          const dataroomEnd = row.dataroom_end
            ? new Date(row.dataroom_end)
            : null;
          const reportEnd = row.report_end ? new Date(row.report_end) : null;
          let latestEnd =
            dataroomEnd && reportEnd
              ? dataroomEnd > reportEnd
                ? dataroomEnd
                : reportEnd
              : dataroomEnd || reportEnd;

          if (
            (!dataroomEnd || dataroomEnd < today) &&
            (!reportEnd || reportEnd < today)
          ) {
            const diffDays = Math.floor(
              (today - latestEnd) / (1000 * 60 * 60 * 24)
            );

            if (diffDays === 42) {
              sendReminder(
                row.email,
                row.company_name,
                "Your data room will be deleted in 2 weeks."
              );
            } else if (diffDays === 49) {
              sendReminder(
                row.email,
                row.company_name,
                "Your data room will be deleted in 1 week."
              );
            } else if (diffDays === 55) {
              sendReminder(
                row.email,
                row.company_name,
                "Your data room will be deleted tomorrow."
              );
            } else if (diffDays >= 56) {
              //console.log(`Deleting files for user ${userId}`);
              // deleteUserFiles(userId);
            }
          }
        }
      }
    );
  } catch (error) {
    console.error("Internal Server Error", error);
  }
};
function sendReminder(to, companyName, message) {
  const subject = `Reminder: Data Room Deletion Notice for ${companyName}`;

  const body = `
    Dear ${companyName},

    This is a friendly reminder that your Data Room subscription has expired.

    ${message}

    If you wish to keep your files and continue allowing investor access, please renew your subscription before the deletion date.

    Regards,  
    Startup Portal Team
    `;

  const mailOptions = {
    from: '"BluePrint Catalyst" <scale@blueprintcatalyst.com>',
    to,
    subject,
    text: body,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) console.error("Error sending email:", error);
    else console.log("Reminder email sent:", info.response);
  });
}

// Run daily at 8:00 AM
cron.schedule("0 8 * * *", async () => {
  console.log("Running daily cron job for data room subscription check");
  await exports.getAllActiveSubscriptions();
});

cron.schedule("*/15 * * * *", async () => {
  try {
    const [meetings] = await db.promise().query(`
      SELECT zr.*, zm.id AS zoom_meeting_id, zm.timezone, zm.meeting_date, zm.time, zm.topic, zm.zoom_link, zm.unique_code
      FROM zoommeeting_register zr
      LEFT JOIN zoommeeting zm 
        ON FIND_IN_SET(
          zm.id, 
          REPLACE(REPLACE(REPLACE(zr.registered_meeting_ids, '[', ''), ']', ''), ' ', '')
        )
    `);

    const [templateResults] = await db
      .promise()
      .query(`SELECT * FROM email_templates`);
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const now = moment().tz(userTimeZone);

    const reminderTypes = {
      reminder_48hr: { hours: 48, dbField: "reminder_48_sent" },
      reminder_24hr: { hours: 24, dbField: "reminder_24_sent" },
      reminder_1hr: { hours: 1, dbField: "reminder_1_sent" },
    };

    for (const [templateType, { hours, dbField }] of Object.entries(
      reminderTypes
    )) {
      const template = templateResults.find((t) => t.type === templateType);
      if (!template) continue;

      for (const meeting of meetings) {
        if (!meeting.meeting_date || !meeting.time) continue;
        if (meeting[dbField] === 1) continue; // already sent

        const [hour, minute] = meeting.time.split(":").map(Number);
        const meetingTimeInOrigin = moment
          .tz(meeting.meeting_date, "YYYY-MM-DD", meeting.timezone)
          .set({ hour, minute, second: 0 });
        const meetingTimeInLocal = meetingTimeInOrigin.clone().tz(userTimeZone);
        const reminderTime = meetingTimeInLocal
          .clone()
          .subtract(hours, "hours");

        const diffMinutes = Math.abs(now.diff(reminderTime, "minutes"));
        console.log(meeting.zoom_meeting_id);
        if (diffMinutes <= 10) {
          const zoomLink =
            "https://blueprintcatalyst.com/api/zoommeeting?token=" +
            meeting.unique_code;

          const replacements = {
            user_name: meeting.name || "User",
            meeting_topic: meeting.topic || "Zoom Meeting",
            event_time: meetingTimeInLocal.format(
              "dddd, MMMM Do YYYY [at] hh:mm A"
            ),
            zoom_link: zoomLink,
          };

          const htmlBody = fillTemplate(template.body, replacements);
          const emailSubject = fillTemplate(template.subject, replacements);

          sendReminderZoom(meeting.email, "Company", htmlBody, emailSubject);

          await db
            .promise()
            .query(
              `UPDATE zoommeeting_register SET ${dbField} = 1 WHERE id = ?`,
              [meeting.id]
            );
        }
      }
    }
  } catch (error) {}
});
function sendReminderZoom(to, companyName, message, subject) {
  const mailOptions = {
    from: '"BluePrint Catalyst" <scale@blueprintcatalyst.com>',
    to,
    subject,
    html: message,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) console.error("Error sending email:", error);
    else console.log(`✅ Reminder email sent to ${to}`);
  });
}
//Cron Job Zoom Meeting
