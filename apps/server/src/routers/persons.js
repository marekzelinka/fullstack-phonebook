import express from "express";

import { Person } from "../models/person.js";

export const personsRouter = express.Router();

personsRouter.post("/", async (req, res) => {
  const user = req.user;
  const { name, number } = req.body;

  const person = await Person.create({ name, number, owner: user._id });

  await user.updateOne({ $push: { persons: person._id } });

  res.status(201).json(person);
});

personsRouter.get("/", async (req, res) => {
  const user = req.user;

  const persons = await Person.find({ owner: user._id });

  res.json(persons);
});

personsRouter.get("/:personId", async (req, res) => {
  const user = req.user;
  const { personId } = req.params;

  const person = await Person.findOne({ _id: personId, owner: user._id });
  if (!person) {
    return res.status(404).json({ error: "Person not found or unauthorized" });
  }

  res.json(person);
});

personsRouter.patch("/:personId", async (req, res) => {
  const user = req.user;
  const { personId } = req.params;
  const { name, number } = req.body;

  const person = await Person.findOneAndUpdate(
    { _id: personId, owner: user._id },
    { name, number },
    { runValidators: true, returnDocument: "after", context: "query" },
  );
  if (!person) {
    return res.status(404).json({ error: "Person not found or unauthorized" });
  }

  res.json(person);
});

personsRouter.delete("/:personId", async (req, res) => {
  const user = req.user;
  const { personId } = req.params;

  const person = await Person.findOneAndDelete({ _id: personId, owner: user._id });
  if (!person) {
    return res.status(404).json({ error: "Person not found or unauthorized" });
  }

  await user.updateOne({ $pull: { persons: personId } });

  res.status(204).end();
});
