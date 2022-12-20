const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");

const app = express();
app.use(express.json());

module.exports = app;

const dbPath = path.join(__dirname, "covid19India.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3002, () => {
      console.log("Server Running at http://localhost:3000");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

app.get("/states/", async (request, response) => {
  const getStatesQuery = `
        SELECT * FROM state ORDER BY state_id;
    `;
  const statesArray = await db.all(getStatesQuery);
  const newArray = statesArray.map((obj) => {
    return {
      stateId: obj.state_id,
      stateName: obj.state_name,
      population: obj.population,
    };
  });
  response.send(newArray);
});

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStatesQuery = `
        SELECT * FROM state WHERE state_id = ${stateId};
    `;
  const obj = await db.get(getStatesQuery);
  const newArray = {
    stateId: obj.state_id,
    stateName: obj.state_name,
    population: obj.population,
  };
  response.send(newArray);
});

app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const createDistrictsQuery = `
        INSERT INTO 
            district (district_name,state_id,cases,cured,active,deaths)
        VALUES (
            '${districtName}',
            ${stateId},
            ${cases},
            ${cured},
            ${active},
            ${deaths}
        );
    `;
  await db.run(createDistrictsQuery);
  response.send("District Successfully Added");
});

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
        SELECT * FROM district WHERE district_id = ${districtId};
    `;
  const obj = await db.get(getDistrictQuery);
  const newArray = {
    districtId: obj.district_id,
    districtName: obj.district_name,
    stateId: obj.state_id,
    cases: obj.cases,
    cured: obj.cured,
    active: obj.active,
    deaths: obj.deaths,
  };
  response.send(newArray);
});

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
        DELETE FROM district WHERE district_id = ${districtId};
    `;
  const obj = await db.run(getDistrictQuery);
  response.send("District Removed");
});

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const createDistrictsQuery = `
        UPDATE 
            district 
        SET 
            district_name = '${districtName}',
            state_Id = ${stateId},
            cases = ${cases},
            cured = ${cured},
            active = ${active},
            deaths = ${deaths}
        WHERE district_id = ${districtId}
    `;
  await db.run(createDistrictsQuery);
  response.send("District Details Updated");
});

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getDistrictQuery = `
        SELECT SUM(cases),SUM(cured),SUM(active),SUM(deaths) FROM district WHERE state_id = ${stateId};
    `;
  const obj = await db.get(getDistrictQuery);
  const newArray = {
    totalCases: obj["SUM(cases)"],
    totalCured: obj["SUM(cured)"],
    totalActive: obj["SUM(active)"],
    totalDeaths: obj["SUM(deaths)"],
  };
  response.send(newArray);
});

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
        SELECT
            *
        FROM
            district
            INNER JOIN state ON state.state_id = district.state_id
        WHERE
            district.district_id = ${districtId};
    `;
  const obj = await db.get(getDistrictQuery);
  console.log(obj);
  const newArray = {
    stateName: obj.state_name,
  };
  response.send(newArray);
});
