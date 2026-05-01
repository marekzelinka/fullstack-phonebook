import supertest from "supertest";
import { beforeEach, describe, test, expect } from "vitest";

import { app } from "../src/app.js";
import * as security from "../src/core/security.js";
import { Contact } from "../src/models/contact.js";
import { User } from "../src/models/user.js";
import * as apiTestUtils from "./api-test-utils.js";

const api = supertest(app);

describe("when there are initially some contacts seeded with a owner", () => {
  let authHeader;
  let user;
  let userContacts;

  beforeEach(async () => {
    const passwordHash = await security.hashPassword(apiTestUtils.initialUser.password);
    user = await User.create({
      username: apiTestUtils.initialUser.username,
      name: apiTestUtils.initialUser.name,
      passwordHash,
    });

    const token = security.createAccessToken({ sub: user.username });
    authHeader = { Authorization: `Bearer ${token}` };

    userContacts = apiTestUtils.getInitialContacts(user._id);
    const contacts = await Contact.insertMany(userContacts);

    // Link seeded contact back to the user
    await User.findByIdAndUpdate(user._id, {
      $push: { contacts: { $each: contacts.map((contact) => contact._id) } },
    });
  });

  describe("addition of a new contact", () => {
    test("succeeds with valid data", async () => {
      const newContact = { name: "Dan Abramov", number: "123-234345" };

      const res = await api.post("/api/contacts").set(authHeader).send(newContact);
      expect(res.status).toBe(201);
      expect(res.headers["content-type"]).toMatch(/json/);

      const contactsAtEnd = await apiTestUtils.getContactsInDb();
      expect(contactsAtEnd).toHaveLength(userContacts.length + 1);

      const names = contactsAtEnd.map((contact) => contact.name);
      expect(names).toContain(newContact.name);

      const userInDb = await User.findOne({ username: apiTestUtils.initialUser.username });
      const userContactIds = userInDb.contacts.map((id) => id.toString());
      expect(userContactIds).toContain(res.body.id);
    });

    test("fails with status 400 and correct error ($error) with invalid data ($data)", async () => {
      const res = await api.post("/api/contacts").set(authHeader).send({ name: "Dan Abramov" });
      expect(res.status).toBe(400);
      expect(res.headers["content-type"]).toMatch(/json/);
      expect(res.body.error).toMatch(/number is required/i);

      const res2 = await api
        .post("/api/contacts")
        .set(authHeader)
        .send({ name: "Dan Abramov", number: "04-1234" });
      expect(res2.body.error).toMatch(/number must be at least 8 characters long/i);

      const res3 = await api
        .post("/api/contacts")
        .set(authHeader)
        .send({ name: "Dan Abramov", number: "4a-12342" });
      expect(res3.body.error).toMatch(/number must be a valid phone number/i);

      const res4 = await api
        .post("/api/contacts")
        .set(authHeader)
        .send({ name: "Da", number: "123-234345" });
      expect(res4.body.error).toMatch(/name must be at least 3 characters long/i);

      const res5 = await api.post("/api/contacts").set(authHeader).send({ number: "123-234345" });
      expect(res5.body.error).toMatch(/name is required/i);

      const res6 = await api
        .post("/api/contacts")
        .set(authHeader)
        .send({ name: userContacts[0].name, number: userContacts[0].number });
      expect(res6.body.error).toMatch(/name must be unique/i);

      const contactsAtEnd = await apiTestUtils.getContactsInDb();
      expect(contactsAtEnd).toHaveLength(userContacts.length);
    });

    test("fails with status 401 if auth header is missing", async () => {
      const newContact = { name: "Dan Abramov", number: "123-234345" };

      const res = await api.post("/api/contacts").send(newContact);
      expect(res.status).toBe(401);
      expect(res.headers["content-type"]).toMatch(/json/);
      expect(res.body.error).toMatch(/invalid authentication credentials/i);
    });
  });

  describe("viewing contacts", () => {
    test("returns all owned by the user", async () => {
      const res = await api.get("/api/contacts").set(authHeader);
      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toMatch(/json/);
      expect(res.body).toHaveLength(userContacts.length);
    });

    test("returned contacts owned by the user match seed content", async () => {
      const res = await api.get("/api/contacts").set(authHeader);

      const names = res.body.map((contact) => contact.name);
      const expectedNames = userContacts.map((contact) => contact.name);
      expect(names).toEqual(expect.arrayContaining(expectedNames));
    });

    test("fails with status 401 if auth header is missing", async () => {
      const res = await api.get("/api/contacts");
      expect(res.status).toBe(401);
      expect(res.headers["content-type"]).toMatch(/json/);
      expect(res.body.error).toMatch(/invalid authentication credentials/i);
    });

    describe("viewing a specific contact", () => {
      test("succeeds when owned by the user", async () => {
        const contactsAtStart = await apiTestUtils.getContactsInDb();
        const contactToView = contactsAtStart[0];

        const res = await api.get(`/api/contacts/${contactToView.id}`).set(authHeader);
        expect(res.status).toBe(200);
        expect(res.headers["content-type"]).toMatch(/json/);
        expect(res.body).toStrictEqual(contactToView);
      });

      test("fails with status 400 if id is invalid", async () => {
        const invalidId = "5a3d5da59070081a82a3445";

        const res = await api.get(`/api/contacts/${invalidId}`).set(authHeader);
        expect(res.status).toBe(400);
        expect(res.headers["content-type"]).toMatch(/json/);
        expect(res.body.error).toMatch(/malformatted id/i);
      });

      test("fails with status 401 if auth header is missing", async () => {
        const contactsAtStart = await apiTestUtils.getContactsInDb();
        const contactToView = contactsAtStart[0];

        const res = await api.get(`/api/contacts/${contactToView.id}`);
        expect(res.status).toBe(401);
        expect(res.headers["content-type"]).toMatch(/json/);
        expect(res.body.error).toMatch(/invalid authentication credentials/i);
      });

      test("fails with status 404 if trying to view someone else's contact", async () => {
        const contactsAtStart = await apiTestUtils.getContactsInDb();
        const contactToView = contactsAtStart[0];

        const otherUser = await User.create({ username: "hacker", passwordHash: "..." });
        const otherHeader = {
          Authorization: `Bearer ${security.createAccessToken({ sub: otherUser.username })}`,
        };

        const res = await api.get(`/api/contacts/${contactToView.id}`).set(otherHeader);
        expect(res.status).toBe(404);
        expect(res.headers["content-type"]).toMatch(/json/);
        expect(res.body.error).toMatch(/contact not found or unauthorized/i);
      });

      test("fails with status 404 if contact does not exist", async () => {
        const validNonexistingId = await apiTestUtils.getValidNonExistingContactId(user._id);

        const res = await api.get(`/api/contacts/${validNonexistingId}`).set(authHeader);
        expect(res.status).toBe(404);
        expect(res.headers["content-type"]).toMatch(/json/);
        expect(res.body.error).toMatch(/contact not found or unauthorized/i);
      });
    });
  });

  describe("update of a contact", () => {
    test("succeeds when owned by the user", async () => {
      const contactsAtStart = await apiTestUtils.getContactsInDb();
      const contactToEdit = contactsAtStart[0];

      const res1 = await api
        .patch(`/api/contacts/${contactToEdit.id}`)
        .set(authHeader)
        .send({ number: "040-1234567" });
      expect(res1.status).toBe(200);
      expect(res1.headers["content-type"]).toMatch(/json/);
      expect(res1.body).toStrictEqual({ ...contactToEdit, number: "040-1234567" });

      const res2 = await api
        .patch(`/api/contacts/${contactToEdit.id}`)
        .set(authHeader)
        .send({ name: "Dan Abramovic" });
      expect(res1.status).toBe(200);
      expect(res2.body).toStrictEqual({
        ...contactToEdit,
        name: "Dan Abramovic",
        number: "040-1234567",
      });

      const res3 = await api
        .patch(`/api/contacts/${contactToEdit.id}`)
        .set(authHeader)
        .send({ name: "Arto Hellas", number: "04-1234567" });
      expect(res1.status).toBe(200);
      expect(res3.body).toStrictEqual({
        ...contactToEdit,
        name: "Arto Hellas",
        number: "04-1234567",
      });
    });

    test("ignores attempts to change the immutable owner", async () => {
      const contactsAtStart = await apiTestUtils.getContactsInDb();
      const contactToEdit = contactsAtStart[0];

      const otherUser = await User.create({ username: "other", passwordHash: "..." });

      const res = await api
        .patch(`/api/contacts/${contactToEdit.id}`)
        .set(authHeader) // auth header is contact owner
        .send({ owner: otherUser._id.toString() });
      expect(res.status).toBe(200);

      const contactInDb = await Contact.findById(contactToEdit.id);
      expect(contactInDb.owner.toString()).not.toBe(otherUser._id.toString());
      expect(contactInDb.owner.toString()).toBe(user._id.toString());
    });

    test("fails with status 400 if id is invalid", async () => {
      const invalidId = "5a3d5da59070081a82a3445";

      const res = await api.patch(`/api/contacts/${invalidId}`).set(authHeader).send({});
      expect(res.status).toBe(400);
      expect(res.headers["content-type"]).toMatch(/json/);
      expect(res.body.error).toMatch(/malformatted id/i);
    });

    test("fails with status 400 if name is taken", async () => {
      const contactsAtStart = await apiTestUtils.getContactsInDb();
      const contactToEdit = contactsAtStart[0];

      const res = await api
        .patch(`/api/contacts/${contactToEdit.id}`)
        .set(authHeader)
        .send({ name: contactsAtStart[1].name });
      expect(res.status).toBe(400);
      expect(res.headers["content-type"]).toMatch(/json/);
      expect(res.body.error).toMatch(/name must be unique/i);
    });

    test("fails with status 401 if auth header is missing", async () => {
      const contactsAtStart = await apiTestUtils.getContactsInDb();
      const contactToEdit = contactsAtStart[0];

      const res = await api
        .patch(`/api/contacts/${contactToEdit.id}`)
        .send({ name: "Arto Hellas", number: "04-1234567" });
      expect(res.status).toBe(401);
      expect(res.headers["content-type"]).toMatch(/json/);
      expect(res.body.error).toMatch(/invalid authentication credentials/i);
    });

    test("fails with status 404 if trying to view someone else's contact", async () => {
      const contactsAtStart = await apiTestUtils.getContactsInDb();
      const contactToEdit = contactsAtStart[0];

      const otherUser = await User.create({ username: "hacker", passwordHash: "..." });
      const otherHeader = {
        Authorization: `Bearer ${security.createAccessToken({ sub: otherUser.username })}`,
      };

      const res = await api
        .patch(`/api/contacts/${contactToEdit.id}`)
        .set(otherHeader)
        .send({ name: "Arto Hellas", number: "04-1234567" });
      expect(res.status).toBe(404);
      expect(res.headers["content-type"]).toMatch(/json/);
      expect(res.body.error).toMatch(/contact not found or unauthorized/i);
    });

    test("fails with status 404 if contact does not exist", async () => {
      const validNonexistingId = await apiTestUtils.getValidNonExistingContactId(user._id);

      const res = await api.get(`/api/contacts/${validNonexistingId}`).set(authHeader);
      expect(res.status).toBe(404);
      expect(res.headers["content-type"]).toMatch(/json/);
      expect(res.body.error).toMatch(/contact not found or unauthorized/i);
    });
  });

  describe("deletion of a contact", () => {
    test("succeeds when owned by user", async () => {
      const contactsAtStart = await apiTestUtils.getContactsInDb();
      const contactToDelete = contactsAtStart[0];

      const res = await api.delete(`/api/contacts/${contactToDelete.id}`).set(authHeader);
      expect(res.status).toBe(204);

      const contactsAtEnd = await apiTestUtils.getContactsInDb();
      expect(contactsAtEnd).toHaveLength(userContacts.length - 1);

      const ids = contactsAtEnd.map((contact) => contact.id);
      expect(ids).not.toContain(contactToDelete.id);

      const userInDb = await User.findOne({ username: apiTestUtils.initialUser.username });
      const userContactIds = userInDb.contacts.map((id) => id.toString());
      expect(userContactIds).not.toContain(contactToDelete.id);
    });

    test("fails with status 400 if id is invalid", async () => {
      const invalidId = "5a3d5da59070081a82a3445";

      const res = await api.delete(`/api/contacts/${invalidId}`).set(authHeader);
      expect(res.status).toBe(400);
      expect(res.headers["content-type"]).toMatch(/json/);
      expect(res.body.error).toMatch(/malformatted id/i);
    });

    test("fails with status 401 if auth header is missing", async () => {
      const contactsAtStart = await apiTestUtils.getContactsInDb();
      const contactToDelete = contactsAtStart[0];

      const res = await api
        .delete(`/api/contacts/${contactToDelete.id}`)
        .send({ name: "Arto Hellas", number: "04-1234567" });
      expect(res.status).toBe(401);
      expect(res.headers["content-type"]).toMatch(/json/);
      expect(res.body.error).toMatch(/invalid authentication credentials/i);
    });

    test("fails with status 404 if trying to delete someone else's contact", async () => {
      const contactsAtStart = await apiTestUtils.getContactsInDb();
      const contactToDelete = contactsAtStart[0];

      const otherUser = await User.create({ username: "hacker", passwordHash: "..." });
      const otherHeader = {
        Authorization: `Bearer ${security.createAccessToken({ sub: otherUser.username })}`,
      };

      const res = await api
        .delete(`/api/contacts/${contactToDelete.id}`)
        .set(otherHeader)
        .send({ name: "Arto Hellas", number: "04-1234567" });
      expect(res.status).toBe(404);
      expect(res.headers["content-type"]).toMatch(/json/);
      expect(res.body.error).toMatch(/contact not found or unauthorized/i);
    });

    test("fails with status 404 if contact does not exist", async () => {
      const validNonexistingId = await apiTestUtils.getValidNonExistingContactId(user._id);

      const res = await api.get(`/api/contacts/${validNonexistingId}`).set(authHeader);
      expect(res.status).toBe(404);
      expect(res.headers["content-type"]).toMatch(/json/);
      expect(res.body.error).toMatch(/contact not found or unauthorized/i);
    });
  });
});
