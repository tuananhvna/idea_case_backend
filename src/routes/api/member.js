// OBSOLETE FILE, NOT FOLLOWING CURRENT IDEAS, Change the endpoints to new model !

import express from "express";
import knex from "../../db/index.js";
import { validationResult } from "express-validator";

// importing self-made response/error handlers from /errorHandlers/index.js
import {
  successHandler,
  requestErrorHandler,
  databaseErrorHandler,
  validationErrorHandler,
} from "../../responseHandlers/index.js";
import { validateAddMember } from '../../validationHandler/index.js'

const member = express.Router();

//GET all contributors
// http://localhost:PORT/api/member/all/contributors

member.get("/old/all/contributors", (req, res) => {
  let subquery = knex("Idea_Member").distinct("memberId");

  knex('Member').whereIn('id', subquery)
    .then(data => {
      successHandler(res, data, "member.get/old/all/contributors: Contributors listed ok from DB");
    })
    .catch((error) => {   // Just a generic error, repetition if file!
      databaseErrorHandler(res, error, "member.get/old/all/contributors: ");
    });
});

member.get("/all/contributors", function (req, res) {
  knex
    .select()
    .from("Member")
    .then(data => {
      successHandler(res, data, "member.get/all: Contributors listed ok from DB");
    })
    .catch((error) => {
      if (error.errno === 1146) {
        databaseErrorHandler(res, error, "member.get/all: Database table Member not created. ");
      } else {
        databaseErrorHandler(res, error, "member.get/all: ");
      }
    });
});

//GET all members
// http://localhost:PORT/api/member/all

member.get("/all", (req, res) => {
  knex
    .select()
    .from("Member")
    .then(data => {
      successHandler(res, data, "member.get/all: Member listed ok from DB");
    })
    .catch((error) => {
      databaseErrorHandler(res, error, "member.get/all: ");
    });
});

// ADD NEW MEMBER
/** http://localhost:PORT/api/member/    with method=POST **/

member.post("/", validateAddMember, (req, res) => {
  // Just a start of err handling for model for you
  const valResult = validationResult(req);

  if (!valResult.isEmpty()) {
    return validationErrorHandler(res, valResult, "validateAddMember error");
  }

  knex
    .insert(req.body)
    .returning("*")
    .into("Member")
    .then((idArray) => {
      successHandler(res, idArray,
        "Adding a member, or multiple members was succesful");
      // Note, will send: [101] or [101,102], an array with all the auto-increment
      // ids for the newly added object(s).
    })
    .catch((error) => {
      if (error.errno == 1062) {
        // https://mariadb.com/kb/en/library/mariadb-error-codes/
        requestErrorHandler(res, `Conflict: Member with the email ${req.body.email} already exists!`);
      } else if (error.errno == 1054) {
        requestErrorHandler(res, "error in spelling [either in 'firstName' and/or in 'lastname' and or in 'email'].");
      } else {
        databaseErrorHandler(res, error);
      }
    });

});

// GET members by id --
/** http://localhost:PORT/api/member/    with method=GET **/
// example: http://localhost:PORT/api/member/1
// This was somehow checked/fixed 2020-02-25
member.get("/:id", (req, res) => {

  if (isNaN(req.params.id)) {
    requestErrorHandler(res, "Member id should be number and this is not: " + req.params.id);
  } else if (req.params.id < 1) {
    requestErrorHandler(res, "Member id should be >= 1 and this is not: " + req.params.id);
  } else {
    knex
      .select()
      .from("Member")
      .where("id", req.params.id)
      .then(data => {
        if (data.length === 1) {
          successHandler(res, data);
        } else {
          requestErrorHandler(res, "Member with id: " + req.params.id + " was not found!");
        }
      })
      .catch((error) => {
        databaseErrorHandler(res, error);
      });
  }

});

/** http://localhost:PORT/api/member/:id    with method=DELETE **/
member.delete("/:id", (req, res) => {
  let id = Number(req.params.id);

  if (isNaN(req.params.id)) {
    requestErrorHandler(res, "Member id should be number and this is not: " + req.params.id);
  } else if (req.params.id < 1) {
    requestErrorHandler(res, "Member id should be >= 1 and this is not: " + req.params.id);
  } else {
    knex
      .delete()
      .from("Member")
      .where("id", id)
      .then(rowsAffected => {
        if (rowsAffected === 1) {
          successHandler(res, rowsAffected,
            "Delete member successful! Count of deleted rows: " + rowsAffected);
        } else {
          requestErrorHandler(res, "Invalid member id: " + id);
        }
      })
      .catch((error) => {
        databaseErrorHandler(res, error);
      });
  }

});

//UPDATE member
/** http://localhost:PORT/api/member/    with method=PUT **/

member.put("/", (req, res) => {

  if (isNaN(req.params.id)) {
    requestErrorHandler(res, "Member id should be number and this is not: " + req.params.id);
  } else if (req.params.id < 1) {
    requestErrorHandler(res, "Member id should be >= 1 and this is not: " + req.params.id);
  } else if (!req.body.firstName) {
    requestErrorHandler(res, "first name is missing.")
  } else if (!req.body.lastName) {
    requestErrorHandler(res, "last name is missing.")
  } else if (!req.body.email) {
    requestErrorHandler(res, "email is missing.")
  } else {
    knex("Member")
      .where("id", req.body.id)
      .update(req.body)
      .then(rowsAffected => {
        if (rowsAffected === 1) {
          successHandler(res, rowsAffected,
            "Update member successful! Count of modified rows: " + rowsAffected)
        } else {
          requestErrorHandler(res, "Update member not successful, " + rowsAffected + " row modified")
        }
      })
      .catch((error) => {
        if (error.errno == 1062) {
          // https://mariadb.com/kb/en/library/mariadb-error-codes/
          requestErrorHandler(res, `DB 1062: Member with the name ${req.body.firstName} already exists!`);
        } else if (error.errno == 1054) {
          requestErrorHandler(res, "error in spelling [either in 'firstName' and/or in 'lastname' and or in 'email'].");
        } else {
          databaseErrorHandler(res, error);
        }
      });
  }

});

//GET Idea & Comments by member id

member.get("/idea/comment/:id", (req, res) => {

  if (isNaN(req.params.id)) {
    requestErrorHandler(res, "Member id should be number and this is not: " + req.params.id);
  } else if (req.params.id < 1) {
    requestErrorHandler(res, "Member id should be >= 1 and this is not: " + req.params.id);
  } else {
    knex.select('commentTimeStamp', 'commentText', 'Idea.name')
      .from('Comment')
      .join('Idea', function () {
        this.on('Idea.id', '=', 'Comment.ideaId')
      })
      .where('Comment.memberId', req.params.id)
      .then(data => {
        if (data.length == 0) {
          res
            .status(404)
            .send("No comments from id " + req.params.id);
        } else {
          successHandler(res, data);
        }
      })
      .catch((error) => {
        databaseErrorHandler(res, error);
      });
  }

});

export default member;
