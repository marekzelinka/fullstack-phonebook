const personCardStyles = { display: "flex", gap: 8 };
export function PersonCard({ person }) {
  return (
    <div style={personCardStyles}>
      <div>
        {person.name} {person.number}
      </div>
    </div>
  );
}
