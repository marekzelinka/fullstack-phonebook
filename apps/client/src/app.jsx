import { useState } from "react";
import { useEffect } from "react";

import { AddPersonForm } from "./components/add-person-form.jsx";
import { PersonFilters } from "./components/person-filters.jsx";
import { PersonList } from "./components/person-list.jsx";
import { personsApi } from "./lib/api.js";

export function App() {
  const [persons, setPersons] = useState([]);

  useEffect(() => {
    personsApi.getAll().then(setPersons);
  }, []);

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
