import { test, vi, expect } from "vitest";
import { render } from "vitest-browser-react";

import { AddContactForm } from "./add-contact-form.jsx";

const MOCK_CONTACT = {
  name: "Arto Hellas",
  number: "04-1234567",
};

test("calls event handler on submit", async () => {
  const onSubmit = vi.fn(() => ({ success: true }));

  const screen = await render(<AddContactForm onSubmit={onSubmit} />);

  await screen.getByLabelText(/name/i).fill(MOCK_CONTACT.name);
  await screen.getByLabelText(/number/i).fill(MOCK_CONTACT.number);

  await screen.getByRole("button", { name: /new contact/i }).click();

  expect(onSubmit).toHaveBeenCalled(MOCK_CONTACT);
});

test("does not call event handler when name is missing", async () => {
  const onSubmit = vi.fn(() => ({ success: true }));

  const screen = await render(<AddContactForm onSubmit={onSubmit} />);

  await screen.getByLabelText(/number/i).fill(MOCK_CONTACT.number);

  await screen.getByRole("button", { name: /new contact/i }).click();

  expect(onSubmit).toHaveBeenCalledTimes(0);
});

test("does not call event handler when name is less than 3 chars", async () => {
  const onSubmit = vi.fn(() => ({ success: true }));

  const screen = await render(<AddContactForm onSubmit={onSubmit} />);

  await screen.getByLabelText(/name/i).fill(MOCK_CONTACT.name.slice(0, 2));
  await screen.getByLabelText(/number/i).fill(MOCK_CONTACT.number);

  await screen.getByRole("button", { name: /new contact/i }).click();

  expect(onSubmit).toHaveBeenCalledTimes(0);
});

test("does not call event handler when number is missing", async () => {
  const onSubmit = vi.fn(() => ({ success: true }));

  const screen = await render(<AddContactForm onSubmit={onSubmit} />);

  await screen.getByLabelText(/name/i).fill(MOCK_CONTACT.name);

  await screen.getByRole("button", { name: /new contact/i }).click();

  expect(onSubmit).toHaveBeenCalledTimes(0);
});

test("does not call event handler when number is invalid", async () => {
  const onSubmit = vi.fn(() => ({ success: true }));

  const screen = await render(<AddContactForm onSubmit={onSubmit} />);

  await screen.getByLabelText(/name/i).fill(MOCK_CONTACT.name);
  await screen.getByLabelText(/number/i).fill("040-02-1234567");

  await screen.getByRole("button", { name: /new contact/i }).click();

  expect(onSubmit).toHaveBeenCalledTimes(0);
});

test("does not call event handler when number is less than 8 chars", async () => {
  const onSubmit = vi.fn(() => ({ success: true }));

  const screen = await render(<AddContactForm onSubmit={onSubmit} />);

  await screen.getByLabelText(/name/i).fill(MOCK_CONTACT.name);
  await screen.getByLabelText(/number/i).fill(MOCK_CONTACT.number.slice(0, -3));

  await screen.getByRole("button", { name: /new contact/i }).click();

  expect(onSubmit).toHaveBeenCalledTimes(0);
});

test("resets form inputs on success", async () => {
  const onSubmit = vi.fn(() => ({ success: true }));

  const screen = await render(<AddContactForm onSubmit={onSubmit} />);

  const nameInput = screen.getByLabelText(/name/i);
  const numberInput = screen.getByLabelText(/number/i);

  await nameInput.fill(MOCK_CONTACT.name);
  await numberInput.fill(MOCK_CONTACT.number);

  await screen.getByRole("button", { name: /new contact/i }).click();

  await expect.element(nameInput).toHaveValue("");
  await expect.element(numberInput).toHaveValue("");
});

test("does not reset form inputs if submission fails", async () => {
  const onSubmit = vi.fn(() => ({ success: false }));

  const screen = await render(<AddContactForm onSubmit={onSubmit} />);

  const nameInput = screen.getByLabelText(/name/i);
  const numberInput = screen.getByLabelText(/number/i);

  await nameInput.fill(MOCK_CONTACT.name);
  await numberInput.fill(MOCK_CONTACT.number);

  await screen.getByRole("button", { name: /new contact/i }).click();

  await expect.element(nameInput).toHaveValue(MOCK_CONTACT.name);
  await expect.element(numberInput).toHaveValue(MOCK_CONTACT.number);
});
