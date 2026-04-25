const fieldStyles = { display: "flex", gap: 8 };

export function AddPersonForm({ onSubmit }) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();

        const form = event.currentTarget;
        const formData = new FormData(form);

        const result = onSubmit({
          name: formData.get("name"),
        });
        if (result.success) {
          form.reset();
        }
      }}
    >
      <div style={fieldStyles}>
        <label htmlFor="name">Name:</label>
        <input type="text" name="name" id="name" required />
      </div>
      <div>
        <button type="submit">Add</button>
      </div>
    </form>
  );
}
