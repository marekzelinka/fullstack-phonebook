import { Contact } from "../src/models/contact.js";
import { User } from "../src/models/user.js";

export function getInitialContacts(userId) {
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

export async function getValidNonExistingContactId(userId) {
  const contact = new Contact({ name: "willremovethissoon", number: "00-000000", owner: userId });
  await contact.save();
  await contact.deleteOne();

  return contact._id.toString();
}

export async function getContactsInDb() {
  const contacts = await Contact.find();

  return contacts.map((doc) => {
    const contact = doc.toJSON();

    return { ...contact, owner: contact.owner.toString() };
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
