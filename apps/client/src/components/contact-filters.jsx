export function ContactFilters({ searchText, onSearchTextChange }) {
  return (
    <div role="group" aria-label="Contact filter options">
      <div>
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
