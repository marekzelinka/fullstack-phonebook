import { useState, useEffect, useRef } from "react";

import { AddContactForm } from "./components/add-contact-form.jsx";
import { Alert } from "./components/alert.jsx";
import { ContactFilters } from "./components/contact-filters.jsx";
import { ContactList } from "./components/contact-list.jsx";
import { Footer } from "./components/footer.jsx";
import { contactsApi } from "./lib/api.js";

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

  const [contacts, setContacts] = useState([]);

  useEffect(() => {
    contactsApi.getAll().then(setContacts);
  }, []);

  const addContact = async ({ name, number }) => {
    const contactWithSameName = contacts.find((contact) => contact.name === name);
    if (contactWithSameName) {
      const shouldReplaceNumber = window.confirm(
        `${name} is already added to phonebook, replace the old number with a new one?`,
      );
      if (!shouldReplaceNumber) {
        return { success: false };
      }

      const contactObject = { number };

      const updatedContact = await contactsApi.update(contactWithSameName.id, contactObject);
      setContacts((prevContacts) =>
        prevContacts.map((contact) =>
          contact.id === contactWithSameName.id ? updatedContact : contact,
        ),
      );

      notify(`Updated number of "${name}"`, { variant: "info" });

      return { success: true };
    }

    const contactObject = {
      name,
      number,
    };

    try {
      const createdPreson = await contactsApi.create(contactObject);
      setContacts((prevContacts) => prevContacts.concat(createdPreson));

      notify(`Added "${name}"`);

      return { success: true };
    } catch (error) {
      notify(error.response.data.error, { variant: "error" });

      return { success: false };
    }
  };

  const deleteContact = async (id) => {
    const existingContact = contacts.find((contact) => contact.id === id);

    const shouldDelete = window.confirm(`Delete "${existingContact.name}"?`);
    if (!shouldDelete) {
      return;
    }

    try {
      await contactsApi.delete(id);

      notify(`Deleted "${existingContact.name}"`, { variant: "info" });
    } catch {
      notify(`Information of "${existingContact.name}" was already removed from server`, {
        variant: "error",
      });
    } finally {
      setContacts((prevContacts) => prevContacts.filter((contact) => contact.id !== id));
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
        <ContactFilters searchText={searchText} onSearchTextChange={setSearchText} />
      </aside>
      <main>
        <section>
          <h2>Add a new contact</h2>
          <AddContactForm onSubmit={addContact} />
        </section>
        <section>
          <h2>Numbers</h2>
          <ContactList contacts={contacts} filterText={searchText} onDelete={deleteContact} />
        </section>
      </main>
      <Footer />
    </>
  );
}
