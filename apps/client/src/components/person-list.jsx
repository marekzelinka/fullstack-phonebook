import { PersonCard } from "./person-card.jsx";

export function PersonList({ persons }) {
  return (
    <ul>
      {persons.map((person) => (
        <li key={person.id}>
          <PersonCard person={person} />
        </li>
      ))}
    </ul>
  );
}
