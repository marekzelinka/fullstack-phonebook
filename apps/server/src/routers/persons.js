import express from "express";

let persons = [
  {
    id: "1",
    name: "Arto Hellas",
    number: "040-123456",
  },
  {
    id: "2",
    name: "Ada Lovelace",
    number: "39-44-5323523",
  },
  {
    id: "3",
    name: "Dan Abramov",
    number: "12-43-234345",
  },
  {
    id: "4",
    name: "Mary Poppendieck",
    number: "39-23-6423122",
  },
];

export const personsRouter = express.Router();

personsRouter.post("/", (req, res) => {
  const { name, number } = req.body;
  if (!name) {
    res.status(400).json({ detail: "Name is required" });

    return;
  }
  const personWithSameName = persons.find((person) => person.name === name);
  if (personWithSameName) {
    res.status(400).json({ detail: "Name must be unique" });

    return;
  }
  if (!number) {
    res.status(400).json({ detail: "Number is required" });

    return;
  }

  const person = {
    name,
    number,
    id: crypto.randomUUID(),
  };
  persons = persons.concat(person);

  res.status(201).json(person);
});

personsRouter.get("/", (_req, res) => {
  res.json(persons);
});

personsRouter.get("/:personId", (req, res) => {
  const existingPerson = persons.find((person) => person.id === req.params.personId);
  if (!existingPerson) {
    res.status(404).json({ detail: "Person not found" });

    return;
  }

  res.json(existingPerson);
});

personsRouter.patch("/:personId", (req, res) => {
  const { name, number } = req.body;

  const existingPerson = persons.find((person) => person.id === req.params.personId);
  if (!existingPerson) {
    res.status(404).json({ detail: "Person not found" });

    return;
  }

  const updatedPerson = {
    ...existingPerson,
    name: name ?? existingPerson.name,
    number: number ?? existingPerson.number,
  };
  if (!updatedPerson.name) {
    res.status(400).json({ detail: "name is required" });

    return;
  }
  if (!updatedPerson.number) {
    res.status(400).json({ detail: "Number is required" });

    return;
  }

  persons = persons.map((person) => (person.id === req.params.personId ? updatedPerson : person));

  res.json(updatedPerson);
});

personsRouter.delete("/:personId", (req, res) => {
  persons = persons.filter((person) => person.id !== req.params.personId);

  res.status(204).end();
});
