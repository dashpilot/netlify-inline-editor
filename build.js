var fs = require("fs");
console.log("starting build...");

// write config file
const s3_url = process.env.S3_URL;
var js = `s3_url = ${s3_url}`;
fs.writeFileSync("./public/config.js", js, "utf8");

console.log("build finished.");