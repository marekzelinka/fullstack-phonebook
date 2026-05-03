const rowStyles = { display: "flex", gap: 4 };

export function ContactFilters({ searchText, onSearchTextChange }) {
  return (
    <div role="group" aria-label="Contact filter options">
      <div style={rowStyles}>
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
    </div>
  );
}
