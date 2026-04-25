import { PersonCard } from "./person-card.jsx";

const listStyles = { listStyle: "none", paddingLeft: 0 };

export function PersonList({ persons }) {
  return (
    <ul style={listStyles}>
      {persons.map((person) => (
        <li key={person.id}>
          <PersonCard person={person} />
        </li>
      ))}
    </ul>
  );
}
