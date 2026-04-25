export function PersonFilters({ filterText, onFilterTextChange }) {
  return (
    <div>
      <div>
        <label>
          Filter shown with{" "}
          <input
            type="search"
            value={filterText}
            onChange={(event) => onFilterTextChange(event.target.value)}
            aria-label="Filter by name"
          />
        </label>
      </div>
    </div>
  );
}
