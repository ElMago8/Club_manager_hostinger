const { app } = require("./src/app.js");

const port = process.env.PORT || 3000;
const host = "0.0.0.0";

console.log("Starting CCM API...");
console.log("PORT:", port);
console.log("NODE_ENV:", process.env.NODE_ENV);

app.listen(port, host, () => {
  console.log(`CCM API listening on ${host}:${port}`);
});
