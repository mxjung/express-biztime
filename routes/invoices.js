const express = require("express");
const router = new express.Router();
const ExpressError = require("../expressError");

const db = require("../db");


/* Return info on invoices: like {invoices: [{id, comp_code}, ...]} */

router.get("/", async function(req, res, next) {

  try {
    const results = await db.query(
      'SELECT * FROM invoices;'
    );
    return res.json({invoices: results.rows});
  }
  catch(err) {
    return next(err);
  }
});


/* Returns obj on given invoice.
If invoice cannot be found, returns 404.
Returns {invoice: {id, amt, paid, add_date, paid_date, company: {code, name, description}} */

router.get("/:id", async function(req, res, next) {

  try {
    const id_invoice = req.params.id
    const invoiceRes = await db.query(
      `SELECT * FROM invoices
       WHERE id = $1 
      `,
       [id_invoice]
    );
    
    if (invoiceRes.rows.length === 0) {
      throw new ExpressError(`Invalid Invoice Code: ${id_invoice}`, 404);
    }

    const companyCode = invoiceRes.rows[0].comp_code;
    const companyRes = await db.query(
      `SELECT * FROM companies
       WHERE code = $1`,
       [companyCode]
    );

    const {id, amt, paid, add_date, paid_date} = invoiceRes.rows[0];
    const invoice = {id, amt, paid, add_date, paid_date};
    invoice.company = companyRes.rows;
    return res.json({invoice});
  }
  catch(err) {
    return next(err);
  }
});


/* Adds an invoice.
** Needs to be passed in JSON body of: {comp_code, amt}
** Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}} */

router.post("/", async function(req, res, next) {

  try {

    const { comp_code, amt } = req.body;


    const result = await db.query(
      `INSERT INTO invoices (comp_code, amt)
       VALUES ($1, $2)
       RETURNING id, comp_code, amt, paid, add_date, paid_date`,
       [comp_code, amt]
    );

    if (result.rows.length === 0) {
      throw new ExpressError(`Invalid Invoice Code: ${id_invoice}`, 404);
    }

    return res.status(201).json({invoice: result.rows[0]});
  }
  catch(err) {
    return next(err);
  }
});


/* Updates an invoice.
** If invoice cannot be found, returns a 404.
** Needs to be passed in a JSON body of {amt}
** Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}} */

router.put("/:id", async function(req, res, next) {

  try {

    const { amt } = req.body;
    const result = await db.query(
      `UPDATE invoices SET amt=$2
       WHERE id = $1
       RETURNING id, comp_code, amt, paid, add_date, paid_date`,
       [req.params.id, amt]
    );
    if (result.rows.length === 0) {
      throw new ExpressError(`Invalid Invoice id: ${req.params.id}`, 404);
    }
    return res.json({invoice: result.rows[0]});
  }
  catch(err) {
    return next(err);
  }
});


/* Deletes an invoice.
** If invoice cannot be found, returns a 404.
** Returns: {status: "deleted"} */

router.delete("/:id", async function(req, res, next) {

  try {

    const result = await db.query(
      `DELETE FROM invoices
       WHERE id = $1
       RETURNING id`,
       [req.params.id]
    );

    if (result.rows.length === 0) {
      throw new ExpressError(`Invalid Invoice id: ${req.params.id}`, 404);
    }

    return res.json({status: "deleted"});
  }
  catch(err) {
    return next(err);
  }
});

module.exports = router;