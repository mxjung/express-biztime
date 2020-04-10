// connect to right DB --- set before loading db.js
process.env.NODE_ENV = "test";

// npm packages
const request = require("supertest");

// app imports
const app = require("../app");
const db = require("../db");

let company;

beforeEach(async function() {
  let result = await db.query(`
    INSERT INTO
      companies (code, name, description) VALUES ('Google', 'Alphabet','Search Engine')
      RETURNING code, name, description`);
  company = result.rows[0];
});

/** GET /companies - returns `{companies: [code, ...]}` */

describe("GET /companies", function() {
  test("Gets a list of 1 company", async function() {
    const response = await request(app).get(`/companies`);
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
      companies: [company]
    });
  });
});
// end

/** GET /companies/[code] - return data about one companu: `{company: company}` */

describe("GET /companies/:id", function() {
  test("Gets a single company", async function() {
    const response = await request(app).get(`/companies/${company.code}`);
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({company: company});
  });

  test("Responds with 404 if can't find company", async function() {
    const response = await request(app).get(`/companies/apple`);
    expect(response.statusCode).toEqual(404);
  });
});
// end


afterEach(async function() {
  // delete any data created by test
  await db.query("DELETE FROM companies");
});

afterAll(async function() {
  // close db connection
  await db.end();
});