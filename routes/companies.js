const express = require("express");
const router = new express.Router();
const ExpressError = require("../expressError");

const db = require("../db");

/* Returns list of companies, like {companies: [{code, name}, ...]} */

router.get("/", async function(req, res, next) {

  try {
    const results = await db.query(
      'SELECT * FROM companies;'
    );
    return res.json({companies: results.rows});
  }
  catch(err) {
    return next(err);
  }
});

/* Return obj of company: {company: {code, name, description}}
** If the company given cannot be found, this should return a 404 status response. */

router.get("/:code", async function(req, res, next) {

  try {
    const code = req.params.code
    const results = await db.query(
      `SELECT * FROM companies
       WHERE code = $1`,
       [code]
    );

    if (results.rows.length === 0) {
      let notFoundError = new Error(`Invalid Company Code: ${code}`)
      notFoundError.status = 404;
      throw notFoundError;
    }
    return res.json({company: results.rows[0]});
  }
  catch(err) {
    return next(err);
  }
});

/* Adds a company.
** Needs to be given JSON like: {code, name, description}
** Returns obj of new company: {company: {code, name, description}} */

router.post("/", async function(req, res, next) {

  try {

    const { code, name, description } = req.body;
    const result = await db.query(
      `INSERT INTO companies (code, name, description)
       VALUES ($1, $2, $3)
       RETURNING code, name, description`,
       [code, name, description]
    );

    return res.status(201).json({company: result.rows[0]});
  }
  catch(err) {
    return next(err);
  }
});

/* Edit existing company.
** Should return 404 if company cannot be found.
** Needs to be given JSON like: {name, description}
** Returns update company object: {company: {code, name, description}} */

router.put("/:code", async function(req, res, next) {

  try {

    const { name, description } = req.body;
    const result = await db.query(
      `UPDATE companies SET name=$2, description=$3
       WHERE code = $1
       RETURNING code, name, description`,
       [req.params.code, name, description]
    );
    if (result.rows.length === 0) {
      throw new ExpressError(`Invalid Company Code: ${req.params.code}`, 404);
    }
    return res.json({company: result.rows[0]});
  }
  catch(err) {
    return next(err);
  }
});

/* Deletes company.
** Should return 404 if company cannot be found.
** Returns {status: "deleted"} */

router.delete("/:code", async function(req, res, next) {

  try {

    const result = await db.query(
      `DELETE FROM companies
       WHERE code = $1
       RETURNING code`,
       [req.params.code]
    );
    if (result.rows.length === 0) {
      throw new ExpressError(`Invalid Company Code: ${req.params.code}`, 404);
    }

    return res.json({status: "deleted"});
  }
  catch(err) {
    return next(err);
  }
});

module.exports = router;