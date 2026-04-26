import { useState } from "react";

import { AddPersonForm } from "./components/add-person-form.jsx";
import { PersonFilters } from "./components/person-filters.jsx";
import { PersonList } from "./components/person-list.jsx";

export function App() {
  const [persons, setPersons] = useState([
    // { name: "Arto Hellas", number: "040-123456", id: 1 },
    // { name: "Ada Lovelace", number: "39-44-5323523", id: 2 },
    // { name: "Dan Abramov", number: "12-43-234345", id: 3 },
    // { name: "Mary Poppendieck", number: "39-23-6423122", id: 4 },
  ]);

  const addPerson = ({ name, number }) => {
    const personWithSameName = persons.find((person) => person.name === name);
    if (personWithSameName) {
      window.alert(`${name} is already added to phonebook!`);

      return;
    }

    const newObject = {
      name,
      number,
      id: persons.length + 1,
    };

    setPersons((persons) => persons.concat(newObject));

    return { success: true };
  };

  const [searchText, setSearchText] = useState("");

  return (
    <>
      <header>
        <h1>Fullstack Phonebook</h1>
      </header>
      <aside>
        <PersonFilters searchText={searchText} onSearchTextChange={setSearchText} />
      </aside>
      <main>
        <section>
          <h2>Add a new person</h2>
          <AddPersonForm onSubmit={addPerson} />
        </section>
        <section>
          <h2>Numbers</h2>
          <PersonList persons={persons} filterText={searchText} />
        </section>
      </main>
    </>
  );
}
