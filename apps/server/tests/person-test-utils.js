import { Person } from "../src/models/person.js";

export const personTestUtils = {
  initial: [
    {
      name: "Arto Hellas",
      number: "04-1234567",
    },
    {
      name: "Ada Lovelace",
      number: "394-5323523",
    },
  ],
  nonExistingId: async () => {
    const person = new Person({ name: "willremovethissoon", number: "00-000000" });
    await person.save();
    await person.deleteOne();

    return person._id.toString();
  },
  getSaved: async () => {
    const persons = await Person.find();

    return persons.map((person) => person.toJSON());
  },
};
