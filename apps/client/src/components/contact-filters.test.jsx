import { expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";

import { ContactFilters } from "./contact-filters.jsx";

test("renders with default search value if provided", async () => {
  const searchText = "Art";

  const screen = await render(
    <ContactFilters searchText={searchText} onSearchTextChange={vi.fn()} />,
  );

  await expect
    .element(screen.getByRole("searchbox", { name: /filter by name/i }))
    .toHaveValue(searchText);
});

test("calls event handler when search value is changed", async () => {
  const onSearchTextChange = vi.fn();

  const screen = await render(
    <ContactFilters searchText="" onSearchTextChange={onSearchTextChange} />,
  );

  await userEvent.type(screen.getByRole("searchbox", { name: /filter by name/i }), "art");

  expect(onSearchTextChange).toHaveBeenCalledTimes(3);
});

test("has correct grouping for accessibility", async () => {
  const screen = await render(<ContactFilters searchText="" onSearchTextChange={vi.fn()} />);

  // Verifies the div acts as a group with the specific label
  await expect
    .element(screen.getByRole("group", { name: /contact filter options/i }))
    .toBeVisible();
});
