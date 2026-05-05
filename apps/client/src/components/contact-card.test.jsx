import { test, vi, expect } from "vitest";
import { render } from "vitest-browser-react";

import { ContactCard } from "./contact-card.jsx";

const MOCK_CONTACT = {
  id: "69f4d84da6568a97bd8d333a",
  name: "Arto Hellas",
  number: "04-1234567",
};

test("renders contact name and number", async () => {
  const screen = await render(<ContactCard contact={MOCK_CONTACT} onDelete={vi.fn()} />);

  await expect.element(screen.getByText(MOCK_CONTACT.name)).toBeVisible();
  await expect.element(screen.getByText(MOCK_CONTACT.number)).toBeVisible();
});

test("calls event handler when delete button is clicked and confirmed", async () => {
  const onDelete = vi.fn();

  const screen = await render(<ContactCard contact={MOCK_CONTACT} onDelete={onDelete} />);

  const shouldDeleteConfirmation = vi.spyOn(window, "confirm").mockImplementation(() => true);
  await screen.getByRole("button", { name: /delete/i }).click();

  expect(shouldDeleteConfirmation).toHaveBeenCalledWith(`Remove contact "${MOCK_CONTACT.name}"?`);
  expect(onDelete).toHaveBeenCalledWith(MOCK_CONTACT.id);
});

test("does not call the event handler when delete button is clicked and not confirmed", async () => {
  const onDelete = vi.fn();

  const screen = await render(<ContactCard contact={MOCK_CONTACT} onDelete={onDelete} />);

  const shouldDeleteConfirmation = vi.spyOn(window, "confirm").mockImplementation(() => false);
  await screen.getByRole("button", { name: /delete/i }).click();

  expect(shouldDeleteConfirmation).toHaveBeenCalledWith(`Remove contact "${MOCK_CONTACT.name}"?`);
  expect(onDelete).toHaveBeenCalledTimes(0);
});

test("has correct grouping for accessibility", async () => {
  const screen = await render(<ContactCard contact={MOCK_CONTACT} onDelete={vi.fn()} />);

  // Verifies the div acts as a group with the specific label
  await expect.element(screen.getByRole("group", { name: /contact actions/i })).toBeVisible();
});
