import supertest from "supertest";
import { beforeEach, describe, test, expect } from "vitest";

import { app } from "../src/app.js";
import { Person } from "../src/models/person.js";
import { personTestUtils } from "./person-test-utils.js";

const api = supertest(app);

describe("when there are initially some persons saved", () => {
  beforeEach(async () => {
    await Person.insertMany(personTestUtils.initial);
  });

  describe("addition of a new person", () => {
    test("succeeds with valid data", async () => {
      const newPerson = { name: "Dan Abramov", number: "123-234345" };

      const res = await api.post("/api/persons").send(newPerson);
      expect(res.status).toBe(201);
      expect(res.headers["content-type"]).toMatch(/json/);

      const personsAtEnd = await personTestUtils.getSaved();
      expect(personsAtEnd).toHaveLength(personTestUtils.initial.length + 1);
      const contents = personsAtEnd.map((person) => person.content);
      expect(contents).toContain(newPerson.content);
    });

    test.each([
      { data: { name: "Dan Abramov" }, error: /number is required/i },
      {
        data: { name: "Dan Abramov", number: "04-1234" },
        error: /number must be at least 8 characters long/i,
      },
      {
        data: { name: "Dan Abramov", number: "4-2-1234" },
        error: /number muse be a valid phone number/i,
      },
      { data: { number: "123-234345" }, error: /name is required/i },
      {
        data: { name: "Da", number: "123-234345" },
        error: /name must be at least 3 characters long/i,
      },
      {
        data: { name: "Arto Hellas", number: "04-1234567" },
        error: /name must be unique/i,
      },
    ])("fails with status 400 with $data and $error", async ({ data, error }) => {
      const res = await api.post("/api/persons").send(data);
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(error);

      const personsAtEnd = await personTestUtils.getSaved();
      expect(personsAtEnd).toHaveLength(personTestUtils.initial.length);
    });
  });

  describe("viewing persons", () => {
    test("persons are returned as json", async () => {
      const res = await api.get("/api/persons");
      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toMatch(/json/);
    });

    test("all persons are returned", async () => {
      const res = await api.get("/api/persons");
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(personTestUtils.initial.length);
    });

    test("a specific person is within the returned persons", async () => {
      const res = await api.get("/api/persons");
      const contents = res.body.map((person) => person.content);
      expect(contents).toContain(personTestUtils.initial[0].content);
    });

    describe("viewing a specific person", () => {
      test("succeeds with a valid id", async () => {
        const personsAtStart = await personTestUtils.getSaved();
        const personToView = personsAtStart[0];

        const res = await api.get(`/api/persons/${personToView.id}`);
        expect(res.status).toBe(200);
        expect(res.headers["content-type"]).toMatch(/json/);
        expect(res.body).toStrictEqual(personToView);
      });

      test("fails with status 404 if person does not exist", async () => {
        const validNonexistingId = await personTestUtils.nonExistingId();

        const res = await api.get(`/api/persons/${validNonexistingId}`);
        expect(res.status).toBe(404);
        expect(res.headers["content-type"]).toMatch(/json/);
        expect(res.body.error).toMatch(/person not found/i);
      });

      test("fails with status 400 if id is invalid", async () => {
        const invalidId = "5a3d5da59070081a82a3445";

        const res = await api.get(`/api/persons/${invalidId}`);
        expect(res.status).toBe(400);
        expect(res.headers["content-type"]).toMatch(/json/);
        expect(res.body.error).toMatch(/malformatted id/i);
      });
    });
  });

  describe("update of a person", () => {
    test("succeeds with a valid id and update data", async () => {
      const personsAtStart = await personTestUtils.getSaved();
      const personToEdit = personsAtStart[0];

      const res1 = await api
        .patch(`/api/persons/${personToEdit.id}`)
        .send({ number: "040-1234567" });
      expect(res1.status).toBe(200);
      expect(res1.headers["content-type"]).toMatch(/json/);
      expect(res1.body).toStrictEqual({ ...personToEdit, number: "040-1234567" });

      const res2 = await api
        .patch(`/api/persons/${personToEdit.id}`)
        .send({ name: "Dan Abramovic" });
      expect(res1.status).toBe(200);
      expect(res2.body).toStrictEqual({
        ...personToEdit,
        name: "Dan Abramovic",
        number: "040-1234567",
      });

      const res3 = await api
        .patch(`/api/persons/${personToEdit.id}`)
        .send({ name: "Arto Hellas", number: "04-1234567" });
      expect(res1.status).toBe(200);
      expect(res3.body).toStrictEqual({
        ...personToEdit,
        name: "Arto Hellas",
        number: "04-1234567",
      });
    });

    test("fails with status 400 if name is taken", async () => {
      const personsAtStart = await personTestUtils.getSaved();
      const personToEdit = personsAtStart[0];

      const res = await api
        .patch(`/api/persons/${personToEdit.id}`)
        .send({ name: personsAtStart[1].name });
      expect(res.status).toBe(400);
      expect(res.headers["content-type"]).toMatch(/json/);
      expect(res.body.error).toMatch(/name must be unique/i);
    });

    test("fails with status 404 if person does not exist", async () => {
      const validNonexistingId = await personTestUtils.nonExistingId();

      const res = await api.patch(`/api/persons/${validNonexistingId}`).send({});
      expect(res.status).toBe(404);
      expect(res.headers["content-type"]).toMatch(/json/);
      expect(res.body.error).toMatch(/person not found/i);
    });

    test("fails with status 400 if id is invalid", async () => {
      const invalidId = "5a3d5da59070081a82a3445";

      const res = await api.patch(`/api/persons/${invalidId}`).send({});
      expect(res.status).toBe(400);
      expect(res.headers["content-type"]).toMatch(/json/);
      expect(res.body.error).toMatch(/malformatted id/i);
    });
  });

  describe("deletion of a person", () => {
    test("succeeds with status 204 if id is valid", async () => {
      const personsAtStart = await personTestUtils.getSaved();
      const personToDelete = personsAtStart[0];

      const res = await api.delete(`/api/persons/${personToDelete.id}`);
      expect(res.status).toBe(204);

      const personsAtEnd = await personTestUtils.getSaved();
      expect(personsAtEnd).toHaveLength(personTestUtils.initial.length - 1);
      const ids = personsAtEnd.map((person) => person.id);
      expect(ids).not.toContain(personToDelete.id);
    });

    test("succeeds with status 204 even if person does not exist", async () => {
      const validNonexistingId = await personTestUtils.nonExistingId();

      const res = await api.delete(`/api/persons/${validNonexistingId}`);
      expect(res.status).toBe(204);
    });

    test("fails with status 400 if id is invalid", async () => {
      const invalidId = "5a3d5da59070081a82a3445";

      const res = await api.delete(`/api/persons/${invalidId}`);
      expect(res.status).toBe(400);
      expect(res.headers["content-type"]).toMatch(/json/);
      expect(res.body.error).toMatch(/malformatted id/i);
    });
  });
});
