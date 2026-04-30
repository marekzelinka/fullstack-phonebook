import supertest from "supertest";
import { beforeEach, describe, test, expect } from "vitest";

import { app } from "../src/app.js";
import * as security from "../src/core/security.js";
import { Person } from "../src/models/person.js";
import { User } from "../src/models/user.js";
import * as apiTestUtils from "./api-test-utils.js";

const api = supertest(app);

describe("when there are initially some persons seeded with a owner", () => {
  let authHeader;
  let user;
  let userPersons;

  beforeEach(async () => {
    const passwordHash = await security.hashPassword(apiTestUtils.initialUser.password);
    user = await User.create({
      username: apiTestUtils.initialUser.username,
      name: apiTestUtils.initialUser.name,
      passwordHash,
    });

    const token = security.createAccessToken({ sub: user.username });
    authHeader = { Authorization: `Bearer ${token}` };

    userPersons = apiTestUtils.getInitialPersons(user._id);
    const persons = await Person.insertMany(userPersons);

    // Link seeded persons back to the user
    await User.findByIdAndUpdate(user._id, {
      $push: { persons: { $each: persons.map((person) => person._id) } },
    });
  });

  describe("addition of a new person", () => {
    test("succeeds with valid data", async () => {
      const newPerson = { name: "Dan Abramov", number: "123-234345" };

      const res = await api.post("/api/persons").set(authHeader).send(newPerson);
      expect(res.status).toBe(201);
      expect(res.headers["content-type"]).toMatch(/json/);

      const personsAtEnd = await apiTestUtils.getPersonsInDb();
      expect(personsAtEnd).toHaveLength(userPersons.length + 1);

      const names = personsAtEnd.map((person) => person.name);
      expect(names).toContain(newPerson.name);

      const userInDb = await User.findOne({ username: apiTestUtils.initialUser.username });
      const userPersonIds = userInDb.persons.map((id) => id.toString());
      expect(userPersonIds).toContain(res.body.id);
    });

    test("fails with status 400 and correct error ($error) with invalid data ($data)", async () => {
      const res = await api.post("/api/persons").set(authHeader).send({ name: "Dan Abramov" });
      expect(res.status).toBe(400);
      expect(res.headers["content-type"]).toMatch(/json/);
      expect(res.body.error).toMatch(/number is required/i);

      const res2 = await api
        .post("/api/persons")
        .set(authHeader)
        .send({ name: "Dan Abramov", number: "04-1234" });
      expect(res2.body.error).toMatch(/number must be at least 8 characters long/i);

      const res3 = await api
        .post("/api/persons")
        .set(authHeader)
        .send({ name: "Dan Abramov", number: "4a-12342" });
      expect(res3.body.error).toMatch(/number must be a valid phone number/i);

      const res4 = await api
        .post("/api/persons")
        .set(authHeader)
        .send({ name: "Da", number: "123-234345" });
      expect(res4.body.error).toMatch(/name must be at least 3 characters long/i);

      const res5 = await api.post("/api/persons").set(authHeader).send({ number: "123-234345" });
      expect(res5.body.error).toMatch(/name is required/i);

      const res6 = await api
        .post("/api/persons")
        .set(authHeader)
        .send({ name: userPersons[0].name, number: userPersons[0].number });
      expect(res6.body.error).toMatch(/name must be unique/i);

      const personsAtEnd = await apiTestUtils.getPersonsInDb();
      expect(personsAtEnd).toHaveLength(userPersons.length);
    });

    test("fails with status 401 if auth header is missing", async () => {
      const newPerson = { name: "Dan Abramov", number: "123-234345" };

      const res = await api.post("/api/persons").send(newPerson);
      expect(res.status).toBe(401);
      expect(res.headers["content-type"]).toMatch(/json/);
      expect(res.body.error).toMatch(/invalid authentication credentials/i);
    });
  });

  describe("viewing persons", () => {
    test("returns all owned by the user", async () => {
      const res = await api.get("/api/persons").set(authHeader);
      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toMatch(/json/);
      expect(res.body).toHaveLength(userPersons.length);
    });

    test("returned persons owned by the user that match seed content", async () => {
      const res = await api.get("/api/persons").set(authHeader);

      const names = res.body.map((person) => person.name);
      const expectedNames = userPersons.map((person) => person.name);
      expect(names).toEqual(expect.arrayContaining(expectedNames));
    });

    test("fails with status 401 if auth header is missing", async () => {
      const res = await api.get("/api/persons");
      expect(res.status).toBe(401);
      expect(res.headers["content-type"]).toMatch(/json/);
      expect(res.body.error).toMatch(/invalid authentication credentials/i);
    });

    describe("viewing a specific person", () => {
      test("succeeds with owned by the user", async () => {
        const personsAtStart = await apiTestUtils.getPersonsInDb();
        const personToView = personsAtStart[0];

        const res = await api.get(`/api/persons/${personToView.id}`).set(authHeader);
        expect(res.status).toBe(200);
        expect(res.headers["content-type"]).toMatch(/json/);
        expect(res.body).toStrictEqual(personToView);
      });

      test("fails with status 400 if id is invalid", async () => {
        const invalidId = "5a3d5da59070081a82a3445";

        const res = await api.get(`/api/persons/${invalidId}`).set(authHeader);
        expect(res.status).toBe(400);
        expect(res.headers["content-type"]).toMatch(/json/);
        expect(res.body.error).toMatch(/malformatted id/i);
      });

      test("fails with status 401 if auth header is missing", async () => {
        const personsAtStart = await apiTestUtils.getPersonsInDb();
        const personToView = personsAtStart[0];

        const res = await api.get(`/api/persons/${personToView.id}`);
        expect(res.status).toBe(401);
        expect(res.headers["content-type"]).toMatch(/json/);
        expect(res.body.error).toMatch(/invalid authentication credentials/i);
      });

      test("fails with status 404 if trying to view someone else's person", async () => {
        const personsAtStart = await apiTestUtils.getPersonsInDb();
        const personToView = personsAtStart[0];

        const otherUser = await User.create({ username: "hacker", passwordHash: "..." });
        const otherHeader = {
          Authorization: `Bearer ${security.createAccessToken({ sub: otherUser.username })}`,
        };

        const res = await api.get(`/api/persons/${personToView.id}`).set(otherHeader);
        expect(res.status).toBe(404);
        expect(res.headers["content-type"]).toMatch(/json/);
        expect(res.body.error).toMatch(/person not found or unauthorized/i);
      });

      test("fails with status 404 if person does not exist", async () => {
        const validNonexistingId = await apiTestUtils.getNonExistingPersonId(user._id);

        const res = await api.get(`/api/persons/${validNonexistingId}`).set(authHeader);
        expect(res.status).toBe(404);
        expect(res.headers["content-type"]).toMatch(/json/);
        expect(res.body.error).toMatch(/person not found or unauthorized/i);
      });
    });
  });

  describe("update of a person", () => {
    test("succeeds when owned by the user", async () => {
      const personsAtStart = await apiTestUtils.getPersonsInDb();
      const personToEdit = personsAtStart[0];

      const res1 = await api
        .patch(`/api/persons/${personToEdit.id}`)
        .set(authHeader)
        .send({ number: "040-1234567" });
      expect(res1.status).toBe(200);
      expect(res1.headers["content-type"]).toMatch(/json/);
      expect(res1.body).toStrictEqual({ ...personToEdit, number: "040-1234567" });

      const res2 = await api
        .patch(`/api/persons/${personToEdit.id}`)
        .set(authHeader)
        .send({ name: "Dan Abramovic" });
      expect(res1.status).toBe(200);
      expect(res2.body).toStrictEqual({
        ...personToEdit,
        name: "Dan Abramovic",
        number: "040-1234567",
      });

      const res3 = await api
        .patch(`/api/persons/${personToEdit.id}`)
        .set(authHeader)
        .send({ name: "Arto Hellas", number: "04-1234567" });
      expect(res1.status).toBe(200);
      expect(res3.body).toStrictEqual({
        ...personToEdit,
        name: "Arto Hellas",
        number: "04-1234567",
      });
    });

    test("ignores attempts to change the immutable owner", async () => {
      const personsAtStart = await apiTestUtils.getPersonsInDb();
      const personToEdit = personsAtStart[0];

      const otherUser = await User.create({ username: "other", passwordHash: "..." });

      const res = await api
        .patch(`/api/persons/${personToEdit.id}`)
        .set(authHeader) // auth header is person owner
        .send({ owner: otherUser._id.toString() });
      expect(res.status).toBe(200);

      const personInDb = await Person.findById(personToEdit.id);
      expect(personInDb.owner.toString()).not.toBe(otherUser._id.toString());
      expect(personInDb.owner.toString()).toBe(user._id.toString());
    });

    test("fails with status 400 if id is invalid", async () => {
      const invalidId = "5a3d5da59070081a82a3445";

      const res = await api.patch(`/api/persons/${invalidId}`).set(authHeader).send({});
      expect(res.status).toBe(400);
      expect(res.headers["content-type"]).toMatch(/json/);
      expect(res.body.error).toMatch(/malformatted id/i);
    });

    test("fails with status 400 if name is taken", async () => {
      const personsAtStart = await apiTestUtils.getPersonsInDb();
      const personToEdit = personsAtStart[0];

      const res = await api
        .patch(`/api/persons/${personToEdit.id}`)
        .set(authHeader)
        .send({ name: personsAtStart[1].name });
      expect(res.status).toBe(400);
      expect(res.headers["content-type"]).toMatch(/json/);
      expect(res.body.error).toMatch(/name must be unique/i);
    });

    test("fails with status 401 if auth header is missing", async () => {
      const personsAtStart = await apiTestUtils.getPersonsInDb();
      const personToEdit = personsAtStart[0];

      const res = await api
        .patch(`/api/persons/${personToEdit.id}`)
        .send({ name: "Arto Hellas", number: "04-1234567" });
      expect(res.status).toBe(401);
      expect(res.headers["content-type"]).toMatch(/json/);
      expect(res.body.error).toMatch(/invalid authentication credentials/i);
    });

    test("fails with status 404 if trying to view someone else's person", async () => {
      const personsAtStart = await apiTestUtils.getPersonsInDb();
      const personToEdit = personsAtStart[0];

      const otherUser = await User.create({ username: "hacker", passwordHash: "..." });
      const otherHeader = {
        Authorization: `Bearer ${security.createAccessToken({ sub: otherUser.username })}`,
      };

      const res = await api
        .patch(`/api/persons/${personToEdit.id}`)
        .set(otherHeader)
        .send({ name: "Arto Hellas", number: "04-1234567" });
      expect(res.status).toBe(404);
      expect(res.headers["content-type"]).toMatch(/json/);
      expect(res.body.error).toMatch(/person not found or unauthorized/i);
    });

    test("fails with status 404 if person does not exist", async () => {
      const validNonexistingId = await apiTestUtils.getNonExistingPersonId(user._id);

      const res = await api.get(`/api/persons/${validNonexistingId}`).set(authHeader);
      expect(res.status).toBe(404);
      expect(res.headers["content-type"]).toMatch(/json/);
      expect(res.body.error).toMatch(/person not found or unauthorized/i);
    });
  });

  describe("deletion of a person", () => {
    test("succeeds when owned by user", async () => {
      const personsAtStart = await apiTestUtils.getPersonsInDb();
      const personToDelete = personsAtStart[0];

      const res = await api.delete(`/api/persons/${personToDelete.id}`).set(authHeader);
      expect(res.status).toBe(204);

      const personsAtEnd = await apiTestUtils.getPersonsInDb();
      expect(personsAtEnd).toHaveLength(userPersons.length - 1);

      const ids = personsAtEnd.map((person) => person.id);
      expect(ids).not.toContain(personToDelete.id);

      const userInDb = await User.findOne({ username: apiTestUtils.initialUser.username });
      const userPersonIds = userInDb.persons.map((id) => id.toString());
      expect(userPersonIds).not.toContain(personToDelete.id);
    });

    test("fails with status 400 if id is invalid", async () => {
      const invalidId = "5a3d5da59070081a82a3445";

      const res = await api.delete(`/api/persons/${invalidId}`).set(authHeader);
      expect(res.status).toBe(400);
      expect(res.headers["content-type"]).toMatch(/json/);
      expect(res.body.error).toMatch(/malformatted id/i);
    });

    test("fails with status 401 if auth header is missing", async () => {
      const personsAtStart = await apiTestUtils.getPersonsInDb();
      const personToDelete = personsAtStart[0];

      const res = await api
        .delete(`/api/persons/${personToDelete.id}`)
        .send({ name: "Arto Hellas", number: "04-1234567" });
      expect(res.status).toBe(401);
      expect(res.headers["content-type"]).toMatch(/json/);
      expect(res.body.error).toMatch(/invalid authentication credentials/i);
    });

    test("fails with status 404 if trying to delete someone else's person", async () => {
      const personsAtStart = await apiTestUtils.getPersonsInDb();
      const personToDelete = personsAtStart[0];

      const otherUser = await User.create({ username: "hacker", passwordHash: "..." });
      const otherHeader = {
        Authorization: `Bearer ${security.createAccessToken({ sub: otherUser.username })}`,
      };

      const res = await api
        .delete(`/api/persons/${personToDelete.id}`)
        .set(otherHeader)
        .send({ name: "Arto Hellas", number: "04-1234567" });
      expect(res.status).toBe(404);
      expect(res.headers["content-type"]).toMatch(/json/);
      expect(res.body.error).toMatch(/person not found or unauthorized/i);
    });

    test("fails with status 404 if person does not exist", async () => {
      const validNonexistingId = await apiTestUtils.getNonExistingPersonId(user._id);

      const res = await api.get(`/api/persons/${validNonexistingId}`).set(authHeader);
      expect(res.status).toBe(404);
      expect(res.headers["content-type"]).toMatch(/json/);
      expect(res.body.error).toMatch(/person not found or unauthorized/i);
    });
  });
});
