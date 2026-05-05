import { ContactCard } from "./contact-card.jsx";

export function ContactList({ contacts, filterText, onDelete }) {
  const filteredContacts = contacts.filter((contact) =>
    contact.name.toLowerCase().includes(filterText.toLowerCase()),
  );

  return (
    <ul role="list" style={{ listStyle: "none", paddingLeft: 0, display: "grid", gap: 6 }}>
      {filteredContacts.map((contact) => (
        <li key={contact.id}>
          <ContactCard contact={contact} onDelete={onDelete} />
        </li>
      ))}
    </ul>
  );
}
