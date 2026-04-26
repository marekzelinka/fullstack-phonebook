import { PersonCard } from "./person-card.jsx";

const listStyles = { listStyle: "none", paddingLeft: 0 };

export function PersonList({ persons, filterText, onDelete }) {
  const filteredPersons = persons.filter((person) =>
    person.name.toLowerCase().includes(filterText.toLowerCase()),
  );

  return (
    <ul role="list" style={listStyles}>
      {filteredPersons.map((person) => (
        <li key={person.id}>
          <PersonCard person={person} onDelete={onDelete} />
        </li>
      ))}
    </ul>
  );
}
