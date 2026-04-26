const personCardStyles = { display: "flex", gap: 8 };
const personCardActionStyles = { display: "flex", gap: 4 };

export function PersonCard({ person, onDelete }) {
  return (
    <div style={personCardStyles}>
      <div>
        {person.name} {person.number}
      </div>
      <div role="group" style={personCardActionStyles} aria-label="Person actions">
        <button type="button" onClick={() => onDelete(person.id)} aria-label="Delete">
          ✖
        </button>
      </div>
    </div>
  );
}
