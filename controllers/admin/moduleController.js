const bcrypt = require("bcryptjs");
const moment = require("moment-timezone");
const db = require("../../db");
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");

const { format } = require("date-fns");
require("dotenv").config();

exports.getmodulelist = (req, res) => {
  db.query("SELECT * FROM module ORDER BY id DESC", async (err, results) => {
    if (err) {
      return res.status(500).json({
        message: "Database query error",
        error: err,
      });
    }

    res.status(200).json({
      message: "Fetched successfully",
      status: "1",
      results: results, // <-- include the results here
    });
  });
};
exports.savemodule = (req, res) => {
  const name = req.body.name;
  const status = req.body.status;
  const description = req.body.description;

  const textt = req.body.textt;
  var id = req.body.id;
  // SQL query to insert video and max_limit into videomanagement table
  if (id) {
    const query =
      "UPDATE module SET textt=?,description=?, name = ?,status=? WHERE id = ?";

    db.query(query, [textt, description, name, status, id], (err, result) => {
      if (err) {
        console.error("Error updating data in database:", err.stack);
        return res.status(500).json({
          message: "Failed to update video details in database",
        });
      }

      res.status(200).json({
        message: "Module updated successfully",
        id: id,
      });
    });
  } else {
    const query =
      "INSERT INTO module (textt,description,name, status) VALUES (?, ?, ?, ?)";
    db.query(query, [textt, description, name, status], (err, result) => {
      if (err) {
        console.error("Error inserting data into database:", err.stack);
        return res
          .status(500)
          .json({ message: "Failed to insert video details into database" });
      }

      // Respond with success if insertion is successful
      res.status(200).json({
        message: "Module created successfully",
      });
    });
  }
};
exports.moduledelete = (req, res) => {
  const videoId = req.body.id; // ID to be deleted

  if (!videoId) {
    return res.status(400).json({ message: "No video ID provided." });
  }

  // MySQL query to delete the video
  const query = "DELETE FROM module WHERE id = ?";

  db.query(query, [videoId], (error, results) => {
    if (error) {
      console.error("Error deleting video:", error);
      return res.status(500).json({ message: "Error deleting video." });
    }

    if (results.affectedRows > 0) {
      return res.status(200).json({ message: "Video deleted successfully." });
    } else {
      return res.status(404).json({ message: "Video not found." });
    }
  });
};
exports.getmodulerecord = (req, res) => {
  const videoId = req.body.id; // ID to be deleted

  if (!videoId) {
    return res.status(400).json({ message: "No video ID provided." });
  }

  // MySQL query to delete the video
  const query = "SELECT *  FROM module WHERE id = ?";

  db.query(query, [videoId], (error, row) => {
    if (error) {
      console.error("Error deleting video:", error);
      return res.status(500).json({ message: "Error deleting video." });
    }

    return res
      .status(200)
      .json({ message: "Video deleted successfully.", results: row });
  });
};

exports.updatelimit = (req, res) => {
  const name = req.body.name;
  const status = req.body.status;
  const price = req.body.price;
  const description = req.body.description;
  const id = req.body.id;
  const annual_price = req.body.annual_price;
  const textt = req.body.textt;

  const query =
    "UPDATE module SET textt=?,annual_price=?,price=?,description=?, name = ?,status=? WHERE id = ?";

  db.query(
    query,
    [textt, annual_price, price, description, name, status, id],
    (err, result) => {
      if (err) {
        console.error("Error updating data in database:", err.stack);
        return res.status(500).json({
          message: "Failed to update video details in database",
        });
      }

      res.status(200).json({
        message: "Module updated successfully",
        id: id,
      });
    }
  );
};

exports.getallUsersMeetinglist = (req, res) => {
  // MySQL query to delete the video
  var user_id = req.body.user_id;
  const query =
    "SELECT zoommeeting_register.name, zoommeeting_register.email, zoommeeting.*, module.name AS module_name FROM zoommeeting_register LEFT JOIN zoommeeting ON zoommeeting.zoom_register_id = zoommeeting_register.id LEFT JOIN module ON module.id = zoommeeting.module_id WHERE zoom_register_id = ?;";

  db.query(query, [user_id], (error, row) => {
    if (error) {
      console.error("Error deleting video:", error);
      return res.status(500).json({ message: "Error deleting video." });
    }

    return res
      .status(200)
      .json({ message: "Video deleted successfully.", results: row });
  });
};
function getFormattedDateTime(timeZone) {
  const date = new Date();

  const options = {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false, // 24-hour format
  };

  const formatter = new Intl.DateTimeFormat("en-CA", options);
  const parts = formatter.formatToParts(date);

  const get = (type) => parts.find((p) => p.type === type)?.value || "";

  const year = get("year");
  const month = get("month");
  const day = get("day");
  const hour = get("hour");
  const minute = get("minute");

  return `${year}-${month}-${day} ${hour}:${minute}`;
}

exports.getallUsersDetaillist = (req, res) => {
  const query = `
    SELECT zoommeeting.*, module.name AS module_name 
    FROM zoommeeting 
    JOIN module ON module.id = zoommeeting.module_id 
    ORDER BY zoommeeting.id DESC;
  `;

  db.query(query, (error, results) => {
    if (error) {
      console.error("Error getting meeting data:", error);
      return res.status(500).json({ message: "Error fetching meeting data." });
    }

    // Fix meeting_date format before sending to frontend
    const formattedResults = results.map((row) => ({
      ...row,
      meeting_date: row.meeting_date
        ? require("moment")(row.meeting_date).format("YYYY-MM-DD")
        : null,
    }));

    return res.status(200).json({
      message: "Meeting list fetched successfully",
      results: formattedResults,
    });
  });
};

exports.mettingDelete = (req, res) => {
  const id = req.body.id; // ID to be deleted

  if (!id) {
    return res.status(400).json({ message: "No video ID provided." });
  }

  // MySQL query to delete the video
  const query = "DELETE FROM zoommeeting WHERE id = ?";

  db.query(query, [id], (error, results) => {
    if (error) {
      console.error("Error deleting video:", error);
      return res.status(500).json({ message: "Error deleting." });
    }

    return res.status(200).json({ message: "Successfully deleted" });
  });
};
exports.getallUserList = (req, res) => {
  const id = req.body.id; // ID to be deleted

  if (!id) {
    return res.status(400).json({ message: "No video ID provided." });
  }

  // MySQL query to delete the video
  const query = "SELECT *  FROM zoommeeting_register WHERE id = ?";

  db.query(query, [id], (error, results) => {
    if (error) {
      console.error("Error deleting video:", error);
      return res.status(500).json({ message: "Error deleting." });
    }

    return res
      .status(200)
      .json({ message: "Successfully deleted", results: results });
  });
};
exports.getallcompnay = (req, res) => {
  // MySQL query to delete the video
  const query = "SELECT *  FROM company order by id desc";

  db.query(query, (error, results) => {
    if (error) {
      console.error("Error deleting video:", error);
      return res.status(500).json({ message: "Error deleting." });
    }

    return res
      .status(200)
      .json({ message: "Successfully deleted", results: results });
  });
};

exports.getallcatgeorylist = (req, res) => {
  // MySQL query to delete the video
  const query =
    "SELECT c.id, c.name, COUNT(s.id) AS subcategory_count FROM dataroomcategories c LEFT JOIN dataroomsub_categories s ON s.dataroom_id = c.id GROUP BY c.id, c.name ORDER BY c.id DESC;";

  db.query(query, (error, results) => {
    if (error) {
      console.error("Error deleting video:", error);
      return res.status(500).json({ message: "Error deleting video." });
    }

    return res
      .status(200)
      .json({ message: "Video deleted successfully.", results: results });
  });
};

exports.dataroomcategorydelete = (req, res) => {
  const id = req.body.id; // ID to be deleted

  if (!id) {
    return res.status(400).json({ message: "No video ID provided." });
  }

  // MySQL query to delete the video

  const querycheck = "SELECT * from dataroomai_summary where category_id =?";

  db.query(querycheck, [id], (error, results) => {
    if (error) {
      console.error("Error deleting video:", error);
      return res.status(500).json({ message: "Error deleting video." });
    }
    if (results.length > 0) {
      return res.status(200).json({
        message:
          "This category cannot be deleted because it is currently associated with a user",
      });
    } else {
      const query = "DELETE FROM dataroomcategories WHERE id = ?";

      db.query(query, [id], (error, results) => {
        if (error) {
          console.error("Error deleting video:", error);
          return res.status(500).json({ message: "Error deleting video." });
        }

        const querys =
          "DELETE FROM dataroomsub_categories WHERE dataroom_id = ?";

        db.query(querys, [id], (error, results) => {
          if (error) {
            console.error("Error deleting video:", error);
            return res.status(500).json({ message: "Error deleting video." });
          }

          return res.status(200).json({ message: "Deleted successfully." });
        });
      });
    }
  });
};

exports.getsubcategorylist = (req, res) => {
  // MySQL query to delete the video
  var id = req.body.id;
  const query =
    "SELECT * from dataroomsub_categories where dataroom_id =? order by id desc";

  db.query(query, [id], (error, results) => {
    if (error) {
      console.error("Error deleting video:", error);
      return res.status(500).json({ message: "Error deleting video." });
    }

    return res
      .status(200)
      .json({ message: "Video deleted successfully.", results: results });
  });
};
exports.checkCatgeory = (req, res) => {
  // MySQL query to delete the video
  var id = req.body.id;
  const query = "SELECT * from dataroomcategories where id =?";

  db.query(query, [id], (error, results) => {
    if (error) {
      console.error("Error deleting video:", error);
      return res.status(500).json({ message: "Error deleting video." });
    }

    return res
      .status(200)
      .json({ message: "Video deleted successfully.", results: results });
  });
};
exports.savedataroomtip = (req, res) => {
  var id = req.body.id;
  if (id) {
    const query =
      "UPDATE dataroomsub_categories SET name=?,tips=? WHERE id = ?";

    db.query(query, [req.body.name, req.body.texttip, id], (err, result) => {
      if (err) {
        console.error("Error updating data in database:", err.stack);
        return res.status(500).json({
          message: "Failed to update video details in database",
        });
      }

      res.status(200).json({
        message: "Sub catgeory updated successfully",
      });
    });
  } else {
    const query =
      "INSERT INTO dataroomsub_categories (dataroom_id,name,tips) VALUES (?, ?, ?)";

    db.query(
      query,
      [req.body.dataroomid, req.body.name, req.body.texttip],
      (err, result) => {
        if (err) {
          console.error("Error updating data in database:", err.stack);
          return res.status(500).json({
            message: "Failed to update video details in database",
          });
        }

        res.status(200).json({
          message: "Sub catgeory created successfully",
        });
      }
    );
  }
};
exports.dataroomPaymentadd = (req, res) => {
  const query = "SELECT * from subscriptiondataroom where id = 1";

  db.query(query, (error, results) => {
    if (error) {
      console.error("Error deleting video:", error);
      return res.status(500).json({ message: "Error deleting video." });
    }
    if (results.length > 0) {
      const query =
        "UPDATE subscriptiondataroom SET investorAnnual_Fee=?,onetime_Fee=?,perInstance_Fee=?,academy_Fee=? WHERE id = 1";

      db.query(
        query,
        [
          req.body.investorAnnual_Fee,
          req.body.onetime_Fee,
          req.body.perInstance_Fee,
          req.body.academy_Fee,
        ],
        (err, result) => {
          if (err) {
            console.error("Error updating data in database:", err.stack);
            return res.status(500).json({
              message: "Failed to update video details in database",
            });
          }

          res.status(200).json({
            message: "Successfully updated",
          });
        }
      );
    } else {
      const query =
        "INSERT INTO subscriptiondataroom (investorAnnual_Fee,onetime_Fee,perInstance_Fee,academy_Fee) VALUES (?,?,?,?)";
      db.query(
        query,
        [
          req.body.investorAnnual_Fee,
          req.body.onetime_Fee,
          req.body.perInstance_Fee,
          req.body.academy_Fee,
        ],
        (err, result) => {
          if (err) {
            console.error("Error inserting data into database:", err.stack);
            return res.status(500).json({
              message: "Failed to insert video details into database",
            });
          }

          // Respond with success if insertion is successful
          res.status(200).json({
            message: "Successfully Saved ",
          });
        }
      );
    }
  });
};

exports.getDataroompayment = (req, res) => {
  const query = "SELECT * from subscriptiondataroom where id = 1";

  db.query(query, (error, row) => {
    if (error) {
      console.error("Error deleting video:", error);
      return res.status(500).json({ message: "Error deleting video." });
    }

    res.status(200).json({
      message: "Successfully updated",
      row: row,
    });
  });
};
exports.userSubscriptionDataRoom = (req, res) => {
  var data = req.body;
  let formData = {
    user_id: data.user_id,
    price: data.user_id,
    created_at: "",
  };
  var date = new Date();
  const query =
    "INSERT INTO usersubscriptiondataroomone_time (user_id,price, created_at) VALUES (?,?,?)";
  db.query(query, [data.user_id, data.price, date], (err, result) => {
    if (err) {
      console.error("Error inserting data into database:", err.stack);
      return res
        .status(500)
        .json({ message: "Failed to insert video details into database" });
    }

    // Respond with success if insertion is successful
    res.status(200).json({
      message: "",
    });
  });
};
exports.getCheckOnetimePayment = (req, res) => {
  var data = req.body;
  const query =
    "SELECT * from  usersubscriptiondataroomone_time where user_id = ? order by id desc";

  db.query(query, [data.user_id], (error, row) => {
    if (error) {
      console.error("Error deleting video:", error);
      return res.status(500).json({ message: "Error deleting video." });
    }

    res.status(200).json({
      message: "Successfully updated",
      row: row,
    });
  });
};
exports.getcompanypayment = (req, res) => {
  var id = req.body.id;
  const query = `
    SELECT *
    FROM usersubscriptiondataroomone_time  where user_id =?
    ORDER BY id DESC
  `;
  db.query(query, [id], (error, results) => {
    if (error) {
      console.error("Error fetching payment data:", error);
      return res.status(500).json({ message: "Error fetching data." });
    }

    res.status(200).json({
      message: "Successfully fetched data",
      results: results,
    });
  });
};
exports.getcompanypaymentAnnual = (req, res) => {
  var id = req.body.id;
  const query = `
    SELECT *
    FROM userinvestorreporting_subscription where user_id =?
    ORDER BY id DESC
  `;
  db.query(query, [id], (error, results) => {
    if (error) {
      console.error("Error fetching payment data:", error);
      return res.status(500).json({ message: "Error fetching data." });
    }

    res.status(200).json({
      message: "Successfully fetched data",
      results: results,
    });
  });
};
exports.getPerinstanceFee = (req, res) => {
  var id = req.body.usersubscriptiondataroomone_time_id;
  const query = `
    SELECT *
    FROM usersubscriptiondataroom_perinstance where usersubscriptiondataroomone_time_id = ? 
    ORDER BY id DESC
  `;
  db.query(query, [id], (error, results) => {
    if (error) {
      console.error("Error fetching payment data:", error);
      return res.status(500).json({ message: "Error fetching data." });
    }
    console.log(results);
    res.status(200).json({
      message: "Successfully fetched data",
      results: results,
    });
  });
};

exports.addDataroomCategory = (req, res) => {
  const name = req.body.name;
  const id = req.body.id;
  const category_tips = req.body.category_tips;
  const document_tips = req.body.document_tips;
  const exits_tips = req.body.exits_tips;

  // SQL query to insert video and max_limit into videomanagement table
  if (id) {
    const query =
      "UPDATE dataroomcategories SET name=?,category_tips=?,document_tips=?,exits_tips=? WHERE id = ?";
    db.query(
      query,
      [name, category_tips, document_tips, exits_tips, id],
      (err, result) => {
        if (err) {
          console.error("Error inserting data into database:", err.stack);
          return res
            .status(500)
            .json({ message: "Failed to insert video details into database" });
        }

        // Respond with success if insertion is successful
        res.status(200).json({
          message: "Category updated successfully",
        });
      }
    );
  } else {
    const query =
      "INSERT INTO dataroomcategories (name,category_tips,document_tips,exits_tips) VALUES (?, ?, ?, ?)";
    db.query(
      query,
      [name, category_tips, document_tips, exits_tips],
      (err, result) => {
        if (err) {
          console.error("Error inserting data into database:", err.stack);
          return res
            .status(500)
            .json({ message: "Failed to insert video details into database" });
        }

        // Respond with success if insertion is successful
        res.status(200).json({
          message: "Category saved successfully",
        });
      }
    );
  }
};

exports.getcategoryData = (req, res) => {
  var id = req.body.id;
  const query = `
    SELECT *
    FROM dataroomcategories where id =?
  `;
  db.query(query, [id], (error, row) => {
    if (error) {
      console.error("Error fetching payment data:", error);
      return res.status(500).json({ message: "Error fetching data." });
    }

    res.status(200).json({
      message: "Successfully fetched data",
      results: row,
    });
  });
};

exports.deletesubcategory = (req, res) => {
  const id = req.body.id; // ID to be deleted

  if (!id) {
    return res.status(400).json({ message: "No video ID provided." });
  }

  // MySQL query to delete the video

  const querys = "DELETE FROM dataroomsub_categories WHERE id = ?";

  db.query(querys, [id], (error, results) => {
    if (error) {
      console.error("Error deleting video:", error);
      return res.status(500).json({ message: "Error deleting video." });
    }

    return res.status(200).json({ message: "Deleted successfully." });
  });
};

exports.discountAddEdit = (req, res) => {
  var data = req.body;
  var expdate = new Date(data.exp_date);
  var date = new Date();
  if (data.id) {
    const query =
      "UPDATE discount_code SET usage_limit=?,percentage=?,exp_date=? WHERE id = ?";
    db.query(
      query,
      [data.usage_limit, data.percentage, expdate, data.id],
      (err, result) => {
        if (err) {
          console.error("Error inserting data into database:", err.stack);
          return res
            .status(500)
            .json({ message: "Failed to insert video details into database" });
        }

        // Respond with success if insertion is successful
        res.status(200).json({
          message: "Successfully updated",
        });
      }
    );
  } else {
    const query =
      "INSERT INTO discount_code (usage_limit,code,percentage,exp_date,created_at) VALUES ( ?, ?, ?, ?,?)";
    db.query(
      query,
      [data.usage_limit, data.code, data.percentage, expdate, date],
      (err, result) => {
        if (err) {
          console.error("Error inserting data into database:", err.stack);
          return res
            .status(500)
            .json({ message: "Failed to insert video details into database" });
        }

        // Respond with success if insertion is successful
        res.status(200).json({
          message: "Successfully created",
        });
      }
    );
  }
};

exports.getdiscountCode = (req, res) => {
  const query = `
    SELECT * from discount_code order by id desc`;
  db.query(query, (error, results) => {
    if (error) {
      console.error("Error fetching payment data:", error);
      return res.status(500).json({ message: "Error fetching data." });
    }

    res.status(200).json({
      message: "Successfully fetched data",
      results: results,
    });
  });
};

exports.deletediscountcode = (req, res) => {
  var id = req.body.id;
  const querys = "DELETE FROM discount_code WHERE id = ?";

  db.query(querys, [id], (error, results) => {
    if (error) {
      console.error("Error deleting video:", error);
      return res.status(500).json({ message: "Error deleting video." });
    }

    return res.status(200).json({ message: "Deleted successfully." });
  });
};
exports.geteditCodeData = (req, res) => {
  var id = req.body.id;
  const querys = "SELECT * FROM discount_code WHERE id = ?";

  db.query(querys, [id], (error, row) => {
    if (error) {
      console.error("Error deleting video:", error);
      return res.status(500).json({ message: "Error deleting video." });
    }

    return res.status(200).json({ message: "", results: row[0] });
  });
};
exports.deletecompany = (req, res) => {
  const id = req.body.id;

  db.getConnection((err, connection) => {
    if (err) {
      console.error("Connection error:", err);
      return res.status(500).json({ message: "Database connection error." });
    }

    connection.beginTransaction((err) => {
      if (err) {
        connection.release();
        return res.status(500).json({ message: "Transaction start failed." });
      }

      const deleteQueries = [
        "DELETE FROM dataroomai_response WHERE user_id = ?",
        "DELETE FROM dataroomai_summary WHERE user_id = ?",
        "DELETE FROM dataroomai_summary_files WHERE user_id = ?",
        "DELETE FROM dataroomai_summary_subcategory WHERE user_id = ?",
        "DELETE FROM dataroomdocuments WHERE user_id = ?",
        "DELETE FROM dataroom_generatedocument WHERE user_id = ?",
        "DELETE FROM investor_information WHERE user_id = ?",
        "DELETE FROM investor_updates WHERE user_id = ?",
        "DELETE FROM sharereport WHERE user_id = ?",
        "DELETE FROM company WHERE id = ?", // company.id is the main key
      ];

      const runQuery = (index) => {
        if (index >= deleteQueries.length) {
          return connection.commit((err) => {
            if (err) {
              return connection.rollback(() => {
                connection.release();
                res.status(500).json({ message: "Commit failed." });
              });
            }

            // ✅ After successful commit, delete folder
            const filePath = path.join(
              __dirname,
              "..",
              "..",
              "upload",
              "docs",
              `doc_${id}`
            );
            fs.rm(filePath, { recursive: true, force: true }, (err) => {
              if (err) {
                console.warn("Folder deletion failed or not found:", filePath);
              } else {
                console.log("Deleted folder:", filePath);
              }

              connection.release();
              res.status(200).json({ message: "Deleted successfully." });
            });
          });
        }

        connection.query(deleteQueries[index], [id], (err) => {
          if (err) {
            return connection.rollback(() => {
              connection.release();
              console.error("Error in deletion:", err);
              res.status(500).json({ message: "Deletion failed." });
            });
          }
          runQuery(index + 1);
        });
      };

      runQuery(0);
    });
  });
};

exports.checkmoduleData = (req, res) => {
  var id = req.body.id;
  db.query("SELECT * FROM module where id=?", [id], async (err, results) => {
    if (err) {
      return res.status(500).json({
        message: "Database query error",
        error: err,
      });
    }

    res.status(200).json({
      results: results, // <-- include the results here
    });
  });
};
//Create Zoom Meet
exports.createzoommeet = (req, res) => {
  const data = req.body;

  // Split datetime-local input into date and time parts
  const [date, time] = data.meeting_date.split("T"); // e.g., "2025-06-26T14:52"

  // ✅ Step 1: Calculate original meeting datetime with timezone
  const meetingDateTime = moment.tz(
    `${date} ${time}`,
    "YYYY-MM-DD HH:mm",
    data.timezone
  );

  // ✅ Step 2: Define time range (±29 minutes for 30-min window overlap check)
  const startTime = meetingDateTime
    .clone()
    .subtract(29, "minutes")
    .format("HH:mm");
  const endTime = meetingDateTime.clone().add(29, "minutes").format("HH:mm");

  // ✅ Step 3: Overlap check query
  let selectQuery = `
    SELECT * FROM zoommeeting 
    WHERE module_id = ?
      AND meeting_date = ?
      AND timezone = ?
      AND time BETWEEN ? AND ?`;
  let queryParams = [data.module_id, date, data.timezone, startTime, endTime];

  // ✅ Step 4: Exclude current meeting if editing
  if (data.id) {
    selectQuery += " AND id != ?";
    queryParams.push(data.id);
  }

  // ✅ Step 5: Run duplicate check
  db.query(selectQuery, queryParams, (err, results) => {
    if (err) {
      return res.status(500).json({ message: "DB error", error: err });
    }

    if (results.length > 0) {
      return res.status(200).json({
        message: "A meeting already exists within 30 minutes of this time.",
        status: "2",
      });
    }

    // ✅ Step 6: Token + expiry
    const code = generateUniqueCode();
    const tokenExpiry = format(new Date(date), "yyyy-MM-dd 23:00:00");

    const now = new Date();
    const expiryInSeconds = Math.floor((meetingDateTime.toDate() - now) / 1000);
    const token = jwt.sign({}, process.env.JWT_SECRET, {
      expiresIn: expiryInSeconds > 0 ? expiryInSeconds : 3600, // fallback 1hr
    });

    // ✅ Step 7: Update
    if (data.id) {
      // Split datetime-local input like "2025-07-03T14:59"
      const [datew, timew] = data.meeting_date.split("T");

      const timezonee = data.timezone || "UTC";
      const localDateTimeStr = `${datew} ${timew}:00`; // "2025-07-03 14:59"

      const updateQuery = `
        UPDATE zoommeeting 
        SET meeting_date_time=?,meeting_id=?, topic=?, access_token=?, ip_address=?, token_expiry=?, 
            module_id=?, meeting_date=?, time=?, timezone=?, zoom_link=?
        WHERE id = ?`;

      const updateParams = [
        localDateTimeStr,
        data.meeting_id,
        data.topic,
        token,
        data.ip_address,
        tokenExpiry,
        data.module_id,
        date,
        time,
        data.timezone,
        data.zoom_link,
        data.id,
      ];

      db.query(updateQuery, updateParams, (err, result) => {
        if (err) {
          console.error("Error updating meeting:", err.stack);
          return res.status(500).json({ message: "Failed to update meeting." });
        }

        return res.status(200).json({
          message: "Zoom meeting updated successfully.",
          status: "1",
        });
      });
    } else {
      // ✅ Step 8: Insert
      const insertQuery = `
        INSERT INTO zoommeeting 
        (meeting_date_time,meeting_id, topic, access_token, ip_address, unique_code, token_expiry, module_id, meeting_date, time, timezone, zoom_link, date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`;

      const insertParams = [
        "",
        data.meeting_id,
        data.topic,
        token,
        data.ip_address,
        code,
        tokenExpiry,
        data.module_id,
        date,
        time,
        data.timezone,
        data.zoom_link,
      ];

      db.query(insertQuery, insertParams, (insertErr, insertResult) => {
        if (insertErr) {
          return res
            .status(500)
            .json({ message: "Insert failed", error: insertErr });
        }

        return res.status(200).json({
          message: "Zoom meeting created successfully.",
          status: "1",
          results: insertResult,
        });
      });
    }
  });
};
function generateUniqueCode(length = 6) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

exports.getzoomdata = (req, res) => {
  var id = req.body.id;
  db.query(
    "SELECT * FROM zoommeeting where id=?",
    [id],
    async (err, results) => {
      if (err) {
        return res.status(500).json({
          message: "Database query error",
          error: err,
        });
      }

      res.status(200).json({
        results: results, // <-- include the results here
      });
    }
  );
};
exports.emailtemplate = (req, res) => {
  const { id, name, type, subject, body } = req.body;

  if (!name || !type || !subject || !body) {
    return res
      .status(400)
      .json({ success: false, status: 2, message: "All fields required" });
  }

  // Check if template with same type already exists (excluding current ID if editing)
  let duplicateCheckQuery = "SELECT * FROM email_templates WHERE type = ?";
  let duplicateCheckParams = [type];

  if (id) {
    duplicateCheckQuery += " AND id != ?";
    duplicateCheckParams.push(id);
  }

  db.query(duplicateCheckQuery, duplicateCheckParams, (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Database query error",
        error: err,
      });
    }

    if (results.length > 0) {
      return res.status(200).json({
        success: true,
        status: 2,
        message: "This template type already exists",
      });
    }

    // Proceed to insert or update based on presence of ID
    if (id) {
      // UPDATE
      const updateQuery = `
        UPDATE email_templates
        SET name = ?, type = ?, subject = ?, body = ?
        WHERE id = ?
      `;
      db.query(updateQuery, [name, type, subject, body, id], (err, result) => {
        if (err) {
          console.error("DB Update Error:", err);
          return res
            .status(500)
            .json({ success: false, message: "Database error" });
        }

        return res.status(200).json({
          success: true,
          status: 1,
          message: "Template updated successfully",
        });
      });
    } else {
      // INSERT
      const insertQuery = `
        INSERT INTO email_templates (name, type, subject, body)
        VALUES (?, ?, ?, ?)
      `;
      db.query(insertQuery, [name, type, subject, body], (err, result) => {
        if (err) {
          console.error("DB Insert Error:", err);
          return res
            .status(500)
            .json({ success: false, message: "Database error" });
        }

        return res.status(200).json({
          success: true,
          status: 1,
          message: "Template created successfully",
        });
      });
    }
  });
};

exports.getemailtemplate = (req, res) => {
  db.query(
    "SELECT * FROM email_templates order by id desc",
    async (err, results) => {
      if (err) {
        return res.status(500).json({
          message: "Database query error",
          error: err,
        });
      }

      res.status(200).json({
        results: results, // <-- include the results here
      });
    }
  );
};

exports.emailtemplateDelete = (req, res) => {
  const videoId = req.body.id; // ID to be deleted

  if (!videoId) {
    return res.status(400).json({ message: "No video ID provided." });
  }

  // MySQL query to delete the video
  const query = "DELETE FROM email_templates WHERE id = ?";

  db.query(query, [videoId], (error, results) => {
    if (error) {
      console.error("Error deleting video:", error);
      return res.status(500).json({ message: "Error deleting video." });
    }

    if (results.affectedRows > 0) {
      return res
        .status(200)
        .json({ message: "Templated deleted successfully." });
    } else {
      return res.status(404).json({ message: "Templated not found." });
    }
  });
};

exports.getemailtemplateSingle = (req, res) => {
  var id = req.body.id;
  db.query(
    "SELECT * FROM email_templates where id = ?",
    [id],
    async (err, row) => {
      if (err) {
        return res.status(500).json({
          message: "Database query error",
          error: err,
        });
      }

      res.status(200).json({
        results: row, // <-- include the results here
      });
    }
  );
};
