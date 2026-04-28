import express from "express";

import { Person } from "../models/person.js";

export const personsRouter = express.Router();

personsRouter.post("/", async (req, res) => {
  const { name, number } = req.body;

  const person = await Person.create({ name, number });

  res.status(201).json(person);
});

personsRouter.get("/", async (_req, res) => {
  const persons = await Person.find();

  res.json(persons);
});

personsRouter.get("/:personId", async (req, res) => {
  const person = await Person.findById(req.params.personId);
  if (!person) {
    res.status(404).json({ error: "Person not found" });

    return;
  }

  res.json(person);
});

personsRouter.patch("/:personId", async (req, res) => {
  const { name, number } = req.body;

  const person = await Person.findByIdAndUpdate(
    req.params.personId,
    { name, number },
    { runValidators: true, returnDocument: "after", context: "query" },
  );
  if (!person) {
    res.status(404).json({ error: "Person not found" });

    return;
  }

  res.json(person);
});

personsRouter.delete("/:personId", async (req, res) => {
  await Person.findByIdAndDelete(req.params.personId);

  res.status(204).end();
});
