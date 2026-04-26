export function PersonFilters({ searchText, onSearchTextChange }) {
  return (
    <div>
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
