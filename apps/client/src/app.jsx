import { useState, useEffect, useRef } from "react";

import { AddContactForm } from "./components/add-contact-form.jsx";
import { Alert } from "./components/alert.jsx";
import { ContactFilters } from "./components/contact-filters.jsx";
import { ContactList } from "./components/contact-list.jsx";
import { Footer } from "./components/footer.jsx";
import { LoginForm } from "./components/login-form.jsx";
import { UserCard } from "./components/user-card.jsx";
import { contactsApi, loginApi } from "./lib/api.js";

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

  const [user, setUser] = useState(() => {
    const userValue = localStorage.getItem("user");
    if (!userValue) {
      return null;
    }

    try {
      return JSON.parse(userValue);
    } catch {
      return null;
    }
  });

  const login = async ({ username, password }) => {
    try {
      const data = await loginApi.login({ username, password });
      const loggedInUser = { username: data.username, name: data.name };
      setUser(loggedInUser);

      localStorage.setItem("user", JSON.stringify(loggedInUser));
      localStorage.setItem("token", data.token);

      return { success: true };
    } catch (error) {
      notify(error.response.data.error, { variant: "error" });

      return { success: false };
    }
  };

  const logout = () => {
    setUser(null);

    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  const [contacts, setContacts] = useState([]);

  useEffect(() => {
    if (!user) {
      return;
    }

    contactsApi.getAll().then(setContacts);
  }, [user]);

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

      try {
        const updatedContact = await contactsApi.update(contactWithSameName.id, contactObject);
        setContacts((prevContacts) =>
          prevContacts.map((contact) =>
            contact.id === contactWithSameName.id ? updatedContact : contact,
          ),
        );

        notify(`Updated number of "${name}"`, { variant: "info" });

        return { success: true };
      } catch (error) {
        notify(error.response.data.error, { variant: "error" });

        return { success: false };
      }
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
        {user ? <UserCard user={user} onLogout={logout} /> : null}
        {alert ? <Alert {...alert} /> : null}
      </header>
      <main>
        {user ? (
          <>
            <section>
              <h2>Add a new contact</h2>
              <AddContactForm onSubmit={addContact} />
            </section>
            <section>
              <h2>Contacts</h2>
              <ContactFilters searchText={searchText} onSearchTextChange={setSearchText} />
              <ContactList contacts={contacts} filterText={searchText} onDelete={deleteContact} />
            </section>
          </>
        ) : (
          <section>
            <h2>Login with your username</h2>
            <LoginForm onSubmit={login} />
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
