import { Person } from "../src/models/person.js";
import { User } from "../src/models/user.js";

export function getInitialPersons(userId) {
  return [
    {
      name: "Arto Hellas",
      number: "04-1234567",
      owner: userId,
    },
    {
      name: "Ada Lovelace",
      number: "394-5323523",
      owner: userId,
    },
  ];
}

export async function getNonExistingPersonId(userId) {
  const person = new Person({ name: "willremovethissoon", number: "00-000000", owner: userId });
  await person.save();
  await person.deleteOne();

  return person._id.toString();
}

export async function getPersonsInDb() {
  const persons = await Person.find();

  return persons.map((doc) => {
    const person = doc.toJSON();

    return { ...person, owner: person.owner.toString() };
  });
}

export const initialUser = {
  username: "root",
  name: "Admin User",
  password: "sekreeet",
};

export async function getUsersInDb() {
  const users = await User.find();

  return users.map((user) => user.toJSON());
}
