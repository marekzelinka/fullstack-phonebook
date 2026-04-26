import { PersonCard } from "./person-card.jsx";

const listStyles = { listStyle: "none", paddingLeft: 0 };

export function PersonList({ persons, filterText }) {
  const filteredPersons = persons.filter((person) =>
    person.name.toLowerCase().includes(filterText.toLowerCase()),
  );

  return (
    <ul role="list" style={listStyles}>
      {filteredPersons.map((person) => (
        <li key={person.id}>
          <PersonCard person={person} />
        </li>
      ))}
    </ul>
  );
}
