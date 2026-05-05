import { useId } from "react";

const fieldStyles = { display: "flex", gap: 8, marginBottom: 6 };

export function AddContactForm({ onSubmit }) {
  const formId = useId();

  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();

        const form = event.currentTarget;
        const formData = new FormData(form);

        const result = await onSubmit({
          name: formData.get("name"),
          number: formData.get("number"),
        });
        if (result.success) {
          form.reset();
        }
      }}
    >
      <div style={fieldStyles}>
        <label htmlFor={`${formId}-name`}>Name</label>
        <input type="text" name="name" id={`${formId}-name`} minLength={3} required />
      </div>
      <div style={fieldStyles}>
        <label htmlFor={`${formId}-number`}>Number</label>
        <input
          type="text"
          name="number"
          id={`${formId}-number`}
          minLength={8}
          pattern="\d{2,3}-\d+"
          required
        />
      </div>
      <div>
        <button type="submit">New contact</button>
      </div>
    </form>
  );
}
