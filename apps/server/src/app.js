import express from "express";

import { personsRouter } from "./routers/persons.js";

export const app = express();

app.use(express.json());

app.use("/api/persons", personsRouter);
