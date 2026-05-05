export function ContactCard({ contact, onDelete }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div>
        <span>{contact.name}</span> <span>{contact.number}</span>
      </div>
      <div role="group" style={{ display: "flex", gap: 4 }} aria-label="Contact actions">
        <button
          type="button"
          onClick={() => {
            const shouldDelete = confirm(`Remove contact "${contact.name}"?`);
            if (shouldDelete) {
              onDelete(contact.id);
            }
          }}
          aria-label="Delete"
        >
          ✖
        </button>
      </div>
    </div>
  );
}
