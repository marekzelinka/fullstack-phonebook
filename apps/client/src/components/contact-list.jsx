import { ContactCard } from "./contact-card.jsx";

const listStyles = { listStyle: "none", paddingLeft: 0 };

export function ContactList({ contacts, filterText, onDelete }) {
  const filteredContacts = contacts.filter((contact) =>
    contact.name.toLowerCase().includes(filterText.toLowerCase()),
  );

  return (
    <ul role="list" style={listStyles}>
      {filteredContacts.map((contact) => (
        <li key={contact.id}>
          <ContactCard contact={contact} onDelete={onDelete} />
        </li>
      ))}
    </ul>
  );
}
