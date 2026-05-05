export function ContactFilters({ searchText, onSearchTextChange }) {
  return (
    <div role="group" style={{ display: "flex", gap: 4 }} aria-label="Contact filter options">
      <label>
        Filter shown with{" "}
        <input
          type="search"
          value={searchText}
          onChange={(event) => onSearchTextChange(event.target.value)}
          aria-label="Filter by name"
        />
      </label>
    </div>
  );
}
