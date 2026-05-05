import { test, vi, expect } from "vitest";
import { render } from "vitest-browser-react";

import { ContactList } from "./contact-list.jsx";

const MOCK_CONTACTS = [
  {
    id: "69f4d84da6568a97bd8d333a",
    name: "Arto Hellas",
    number: "04-1234567",
  },
  {
    id: "69ef04b887bad89639b19206",
    name: "Ada Lovelace",
    number: "394-5323523",
  },
];

test("renders all contacts when filter is empty", async () => {
  const screen = await render(
    <ContactList contacts={MOCK_CONTACTS} filterText="" onDelete={vi.fn()} />,
  );

  const items = screen.getByRole("list").getByRole("listitem");

  expect(items.all()).toHaveLength(MOCK_CONTACTS.length);

  await expect.element(items.nth(0)).toHaveTextContent(MOCK_CONTACTS[0].name);
  await expect.element(items.nth(1)).toHaveTextContent(MOCK_CONTACTS[1].name);
});

test("filters contacts by name (case-insensitive)", async () => {
  const screen = await render(
    <ContactList contacts={MOCK_CONTACTS} filterText="Art" onDelete={vi.fn()} />,
  );

  const items = screen.getByRole("list").getByRole("listitem");

  expect(items.all()).toHaveLength(MOCK_CONTACTS.length - 1);

  await expect.element(items.nth(0)).toHaveTextContent(MOCK_CONTACTS[0].name);
  await expect.element(items.getByText(MOCK_CONTACTS[1].name)).not.toBeInTheDocument();

  await screen.rerender(
    <ContactList contacts={MOCK_CONTACTS} filterText="Ada" onDelete={vi.fn()} />,
  );

  expect(items.all()).toHaveLength(MOCK_CONTACTS.length - 1);

  await expect.element(items.nth(0)).toHaveTextContent(MOCK_CONTACTS[1].name);
  await expect.element(items.getByText(MOCK_CONTACTS[0].name)).not.toBeInTheDocument();
});

test("handles empty contacts array", async () => {
  const screen = await render(<ContactList contacts={[]} filterText="" onDelete={vi.fn()} />);

  const list = screen.getByRole("list");

  await expect.element(list).toBeEmptyDOMElement();
  await expect.element(list.getByRole("listitem")).toHaveLength(0);
  await expect.element(screen.getByText(MOCK_CONTACTS[0].name)).not.toBeInTheDocument();
  await expect.element(screen.getByText(MOCK_CONTACTS[1].name)).not.toBeInTheDocument();
});

test("uses correct list semantics for accessibility", async () => {
  const screen = await render(
    <ContactList contacts={MOCK_CONTACTS} filterText="" onDelete={vi.fn()} />,
  );

  await expect.element(screen.getByRole("list")).toBeVisible();
  expect(screen.getByRole("listitem")).toHaveLength(2);
});

test("passes event handlers correctly to child ContactCard's", async () => {
  const onDelete = vi.fn();

  const screen = await render(
    <ContactList contacts={MOCK_CONTACTS} filterText="" onDelete={onDelete} />,
  );

  const items = screen.getByRole("list").getByRole("listitem");
  const firstItem = items.nth(0);

  vi.spyOn(window, "confirm").mockImplementation(() => true);

  // Click the delete button inside the rendered BlogCard
  await firstItem.getByRole("button", { name: /delete/i }).click();

  expect(onDelete).toHaveBeenCalledWith(MOCK_CONTACTS[0].id);
});
