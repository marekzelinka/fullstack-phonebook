import { useState, useEffect, useRef } from "react";

import { AddPersonForm } from "./components/add-person-form.jsx";
import { Alert } from "./components/alert.jsx";
import { PersonFilters } from "./components/person-filters.jsx";
import { PersonList } from "./components/person-list.jsx";
import { personsApi } from "./lib/api.js";

export function App() {
  const [alert, setAlert] = useState(null);
  const alertTimeoutIdRef = useRef();

  const notify = (message, { variant = "success" } = {}) => {
    if (alertTimeoutIdRef.current) {
      clearTimeout(alertTimeoutIdRef.current);
    }

    setAlert({ variant, message });
    const timeoutId = setTimeout(() => setAlert(null), 3500);

    alertTimeoutIdRef.current = timeoutId;
  };

  const [persons, setPersons] = useState([]);

  useEffect(() => {
    personsApi.getAll().then(setPersons);
  }, []);

  const addPerson = async ({ name, number }) => {
    const personWithSameName = persons.find((person) => person.name === name);
    if (personWithSameName) {
      const shouldReplaceNumber = window.confirm(
        `${name} is already added to phonebook, replace the old number with a new one?`,
      );
      if (!shouldReplaceNumber) {
        return { success: false };
      }

      const personObject = { ...personWithSameName, number };

      const updatedPerson = await personsApi.update(personWithSameName.id, personObject);
      setPersons((prevPersons) =>
        prevPersons.map((person) => (person.id === personWithSameName.id ? updatedPerson : person)),
      );

      notify(`Updated number of "${name}"`, { variant: "info" });

      return { success: true };
    }

    const personObject = {
      name,
      number,
    };

    const createdPreson = await personsApi.create(personObject);
    setPersons((prevPersons) => prevPersons.concat(createdPreson));

    notify(`Added "${name}"`);

    return { success: true };
  };

  const deletePerson = async (id) => {
    const existingPerson = persons.find((person) => person.id === id);

    const shouldDelete = window.confirm(`Delete "${existingPerson.name}"?`);
    if (!shouldDelete) {
      return;
    }

    try {
      await personsApi.delete(id);

      notify(`Deleted "${existingPerson.name}"`, { variant: "info" });
    } catch {
      notify(`Information of "${existingPerson.name}" was already removed from server`, {
        variant: "error",
      });
    } finally {
      setPersons((prevPersons) => prevPersons.filter((person) => person.id !== id));
    }
  };

  const [searchText, setSearchText] = useState("");

  return (
    <>
      <header>
        <h1>Fullstack Phonebook</h1>
        {alert ? <Alert {...alert} /> : null}
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
