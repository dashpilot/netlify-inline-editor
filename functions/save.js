const AWS = require("aws-sdk");

exports.handler = function(event, context, callback) {
    try {
        const { user } = context.clientContext;

        //console.log(user);

        if (!user) throw new Error("Not Authorized");

        if (event.httpMethod !== "POST") {
            return {
                statusCode: 405,
                body: "Method Not Allowed",
            };
        }

        const jsondata = JSON.parse(event.body);

        // Configure client for use with Spaces
        const spacesEndpoint = new AWS.Endpoint(process.env.S3_ENDPOINT);
        const s3 = new AWS.S3({
            endpoint: spacesEndpoint,
            accessKeyId: process.env.S3_KEY,
            secretAccessKey: process.env.S3_SECRET,
        });

        if (jsondata.type == "json") {
            const filename = "data.json";
            var params = {
                Body: JSON.stringify(jsondata.data),
                Bucket: process.env.S3_BUCKET,
                Key: user.sub + "/" + filename,
                ContentType: "application/json",
                ACL: "public-read",
            };

            s3.putObject(params, function(err, data) {
                if (err) console.log(err, err.stack);
                else console.log(data);

                callback(null, {
                    statusCode: 200,
                    body: filename,
                });
            });
        } else if (jsondata.type == "image") {
            let base64 = jsondata.data;
            let base64data = new Buffer.from(
                base64.replace(/^data:image\/\w+;base64,/, ""),
                "base64"
            );
            let imgtype = base64.split(";")[0].split("/")[1];
            const filename =
                "img/" +
                Math.random().toString(36).substring(2, 15) +
                Math.random().toString(36).substring(2, 15) +
                "." +
                imgtype;
            var params = {
                Body: base64data,
                Bucket: process.env.S3_BUCKET,
                Key: user.sub + "/" + filename,
                ContentEncoding: "base64",
                ContentType: `image/${imgtype}`,
                ACL: "public-read",
            };

            s3.putObject(params, function(err, data) {
                if (err) console.log(err, err.stack);
                else console.log(data);

                callback(null, {
                    statusCode: 200,
                    body: filename,
                });
            });
        }
    } catch (error) {
        return {
            statusCode: 401,
            body: "Not Authorized.",
        };
    }
};