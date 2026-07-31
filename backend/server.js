const express = require("express");
const cors = require("cors");
require("dotenv/config");
const mongoose = require("mongoose");

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.get("/", (req, res) => {
  res.send("Hello to FitKit Fitness Tracker API");
});
mongoose.connect(
  process.env.MONGO_URI,
  { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true },
  () => console.log("Database connected")
);

const authRouter = require("./routes/auth");
const exercisesRouter = require("./routes/exercises");
const usersRouter = require("./routes/users");
const mealsRouter = require("./routes/meals");
const workoutsRouter = require("./routes/workouts");
const savedExercisesRouter = require("./routes/savedExercises");
const savedMealsRouter = require("./routes/savedMeals");

app.use("/auth", authRouter);
app.use("/exercises", exercisesRouter);
app.use("/users", usersRouter);
app.use("/meals", mealsRouter);
app.use("/workouts", workoutsRouter);
app.use("/saved-exercises", savedExercisesRouter);
app.use("/saved-meals", savedMealsRouter);

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
