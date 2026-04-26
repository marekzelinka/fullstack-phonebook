const fieldStyles = { display: "flex", gap: 8 };

export function AddPersonForm({ onSubmit }) {
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
        <label htmlFor="name">Name</label>
        <input type="text" name="name" id="name" required />
      </div>
      <div style={fieldStyles}>
        <label htmlFor="number">Number</label>
        <input type="text" name="number" id="number" required />
      </div>
      <div style={fieldStyles}>
        <button type="submit">Add</button>
      </div>
    </form>
  );
}
