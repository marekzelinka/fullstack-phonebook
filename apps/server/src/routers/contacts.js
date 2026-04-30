import express from "express";

import { Contact } from "../models/contact.js";

export const contactsRouter = express.Router();

contactsRouter.post("/", async (req, res) => {
  const user = req.user;
  const { name, number } = req.body;

  const contact = await Contact.create({ name, number, owner: user._id });

  await user.updateOne({ $push: { contacts: contact._id } });

  res.status(201).json(contact);
});

contactsRouter.get("/", async (req, res) => {
  const user = req.user;

  const contacts = await Contact.find({ owner: user._id });

  res.json(contacts);
});

contactsRouter.get("/:contactId", async (req, res) => {
  const user = req.user;
  const { contactId } = req.params;

  const contact = await Contact.findOne({ _id: contactId, owner: user._id });
  if (!contact) {
    return res.status(404).json({ error: "Contact not found or unauthorized" });
  }

  res.json(contact);
});

contactsRouter.patch("/:contactId", async (req, res) => {
  const user = req.user;
  const { contactId } = req.params;
  const { name, number } = req.body;

  const contact = await Contact.findOneAndUpdate(
    { _id: contactId, owner: user._id },
    { name, number },
    { runValidators: true, returnDocument: "after", context: "query" },
  );
  if (!contact) {
    return res.status(404).json({ error: "Contact not found or unauthorized" });
  }

  res.json(contact);
});

contactsRouter.delete("/:contactId", async (req, res) => {
  const user = req.user;
  const { contactId } = req.params;

  const contact = await Contact.findOneAndDelete({ _id: contactId, owner: user._id });
  if (!contact) {
    return res.status(404).json({ error: "Contact not found or unauthorized" });
  }

  await user.updateOne({ $pull: { contacts: contactId } });

  res.status(204).end();
});
