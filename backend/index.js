const connectToMongo = require("./Database/db");
const express = require("express");
const app = express();
const path = require("path");
connectToMongo();
const port = process.env.PORT || 4000;
var cors = require("cors");

// Allow localhost dev ports (3000/3001) in addition to env-configured frontend URL
const allowedOrigins = [
  process.env.FRONTEND_API_LINK,
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // mobile apps / curl
      if (
        allowedOrigins.includes(origin) ||
        /http:\/\/localhost:\d+/.test(origin) ||
        /http:\/\/127\.0\.0\.1:\d+/.test(origin)
      ) {
        return callback(null, true);
      }
      return callback(null, false);
    },
  })
);

app.use(express.json()); //to convert request data to json

app.get("/", (req, res) => {
  res.send("Hello 👋 I am Working Fine 🚀");
});

app.use("/media", express.static(path.join(__dirname, "media")));

app.use("/api/admin", require("./routes/details/admin-details.route"));
app.use("/api/faculty", require("./routes/details/faculty-details.route"));
app.use("/api/student", require("./routes/details/student-details.route"));

app.use("/api/branch", require("./routes/branch.route"));
app.use("/api/subject", require("./routes/subject.route"));
app.use("/api/notice", require("./routes/notice.route"));
app.use("/api/timetable", require("./routes/timetable.route"));
app.use("/api/material", require("./routes/material.route"));
app.use("/api/lostfound", require("./routes/lostfound.route"));
app.use("/api/societies", require("./routes/society.route"));
app.use("/api/exam", require("./routes/exam.route"));
app.use("/api/marks", require("./routes/marks.route"));
app.use("/api/attendance", require("./routes/attendance.route"));
app.use("/api/chatbot", require("./routes/chatbot.route"));
app.use("/api/gemini", require("./routes/gemini.route"));

app.listen(port, () => {
  console.log(`Server Listening On http://localhost:${port}`);
});
