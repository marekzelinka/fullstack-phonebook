import { useState } from "react";

import { AddPersonForm } from "./components/add-person-form.jsx";
import { PersonList } from "./components/person-list.jsx";

export function App() {
  const [persons, setPersons] = useState([
    { name: "Arto Hellas", number: "040-123456", id: 1 },
    { name: "Ada Lovelace", number: "39-44-5323523", id: 2 },
    { name: "Dan Abramov", number: "12-43-234345", id: 3 },
    { name: "Mary Poppendieck", number: "39-23-6423122", id: 4 },
  ]);

  const addPerson = ({ name }) => {
    const personWithSameName = persons.find((person) => person.name === name);
    if (personWithSameName) {
      window.alert(`${name} is already added to phonebook!`);

      return;
    }

    const newObject = {
      name,
      id: persons.length + 1,
    };

    setPersons((persons) => persons.concat(newObject));

    return { success: true };
  };

  return (
    <>
      <h1>Fullstack Phonebook</h1>
      <aside>{/* <PersonFilters  />*/}</aside>
      <AddPersonForm onSubmit={addPerson} />
      <h2>Numbers</h2>
      <PersonList persons={persons} />
    </>
  );
}
