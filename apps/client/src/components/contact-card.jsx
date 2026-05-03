const cardStyles = { display: "flex", alignItems: "center", gap: 8 };
const cardActionStyles = { display: "flex", gap: 4 };

export function ContactCard({ contact, onDelete }) {
  return (
    <div style={cardStyles}>
      <div>
        {contact.name} {contact.number}
      </div>
      <div role="group" style={cardActionStyles} aria-label="Contact actions">
        <button type="button" onClick={() => onDelete(contact.id)} aria-label="Delete">
          ✖
        </button>
      </div>
    </div>
  );
}
