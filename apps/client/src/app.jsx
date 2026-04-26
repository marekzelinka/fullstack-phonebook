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

  const addPerson = async ({ name, number }) => {
    const personWithSameName = persons.find((person) => person.name === name);
    if (personWithSameName) {
      window.alert(`${name} is already added to phonebook!`);

      return;
    }

    const personObject = {
      name,
      number,
    };

    const createdPreson = await personsApi.create(personObject);
    setPersons((persons) => persons.concat(createdPreson));

    return { success: true };
  };

  const deletePerson = async (id) => {
    const existingPerson = persons.find((person) => person.id === id);

    const shouldDelete = window.confirm(`Delete "${existingPerson.name}"?`);
    if (!shouldDelete) {
      return;
    }

    await personsApi.delete(id);
    setPersons((persons) => persons.filter((person) => person.id !== id));
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
          <PersonList persons={persons} filterText={searchText} onDelete={deletePerson} />
        </section>
      </main>
    </>
  );
}
