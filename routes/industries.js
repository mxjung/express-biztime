const express = require("express");
const router = new express.Router();
const ExpressError = require("../expressError");

const db = require("../db");


/* Returns list of industries, like {industries: [{code, industry, companies: {...}}, ...]} */

router.get("/", async function (req, res, next) {

  try {
    const industry_company = req.params.code
    const results = await db.query(
      `SELECT 
        industries.code, 
        industries.industry, 
        companies_industries.company_code
       FROM industries
       LEFT JOIN companies_industries
        ON industries.code = companies_industries.industry_code
       `
    );

    if (results.rows.length === 0) {
      throw new ExpressError(`Invalid industry Code: ${industry_company}`, 404);
    }

    // let {code, industry, company_code} = results.rows[0];
    // let companies = results.rows.map(r => r.company_code);
    
    let industriesObj = {};
    console.log(results.rows);
    for (let row of results.rows) {
      if (row.industry in industriesObj) {
        industriesObj[row.industry].push(row.company_code);
      } else {
        industriesObj[row.industry] = [row.company_code];
      }
    }
    return res.json({industries: industriesObj});
  }
  catch (err) {
    return next(err);
  }
});





/* Adds a Industry.
** Needs to be given JSON like: {code, industry}
** Returns obj of new company: {industry: {code, industry}} */

router.post("/", async function (req, res, next) {

  try {
    const { code, industry } = req.body;
    const result = await db.query(
      `INSERT INTO industries (code, industry)
       VALUES ($1, $2)
       RETURNING code, industry`,
      [code, industry]
    );

    return res.status(201).json({ industry: result.rows[0] });
  }
  catch (err) {
    return next(err);
  }
});





module.exports = router;