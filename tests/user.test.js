const request = require("supertest");
const app = require("../src/app");
const User = require("../src/models/user");
const { userOneId, userOne, setupDatabase } = require("./fixtures/db");

jest.setTimeout(30000);

beforeEach(setupDatabase);

test("Should signup a new user", async () => {
  const response = await request(app)
    .post("/users")
    .send({
      name: "Ozan Zorlu",
      email: "andrew3@example.com",
      password: "Red1234!",
    })
    .expect(201);

  // Assert that the database was changed correctly
  const user = await User.findById(response.body.user._id);
  expect(user).not.toBeNull();

  // Assertions about the response
  expect(response.body).toMatchObject({
    user: {
      name: "Ozan Zorlu",
      email: "andrew3@example.com",
    },
    token: user.tokens[0].token,
  });
  expect(user.password).not.toBe("Red1234!");
});

test("Should not sign up with invalid name", async () => {
  await request(app)
    .post("/users")
    .send({
      email: "andrew3@example.com",
      password: "Red1234!",
    })
    .expect(400);
});

test("Should not sign up with invalid email", async () => {
  await request(app)
    .post("/users")
    .send({
      name: "Ozan Zorlu",
      email: "andrew3",
      password: "Red1234!",
    })
    .expect(400);
});

test("Should not sign up with invalid password", async () => {
  await request(app)
    .post("/users")
    .send({
      name: "Ozan Zorlu",
      email: "andrew3@example.com",
      password: "red",
    })
    .expect(400);
});

test("Should login existing user", async () => {
  const response = await request(app)
    .post("/users/login")
    .send({
      email: userOne.email,
      password: userOne.password,
    })
    .expect(200);

  const user = await User.findById(userOneId);
  expect(user).not.toBeNull();

  expect(response.body.token).toBe(user.tokens[1].token);
});

test("Should not login nonexistent user", async () => {
  await request(app)
    .post("/users/login")
    .send({
      email: userOne.email,
      password: "thisisnotmypass",
    })
    .expect(400);
});

test("Should get profile for user", async () => {
  await request(app)
    .get("/users/me")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);
});

test("Should not get profile for unauthenticated user ", async () => {
  await request(app).get("/users/me").send().expect(401);
});

test("Should delete account for user", async () => {
  await request(app)
    .delete("/users/me")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);

  const user = await User.findById(userOneId);
  expect(user).toBeNull();
});

test("Should not delete account for unauthenticated user ", async () => {
  await request(app).delete("/users/me").send().expect(401);
});

test("Should not delete user if unauthenticated", async () => {
  await request(app)
    .delete("/users/me")
    .set("Authorization", ``)
    .send()
    .expect(401);
});

test("Should upload avatar image", async () => {
  await request(app)
    .post("/users/me/avatar")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .attach("avatar", "tests/fixtures/profile-pic.jpg")
    .expect(200);

  const user = await User.findById(userOneId);
  expect(user.avatar).toEqual(expect.any(Buffer));
});

test("Should update valid user fields", async () => {
  await request(app)
    .patch("/users/me")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send({
      name: "Jess",
    })
    .expect(200);

  const user = await User.findById(userOneId);

  expect(user.name).toEqual("Jess");
});

test("Should not update invalid user fields", async () => {
  await request(app)
    .patch("/users/me")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send({
      location: "Bursa",
    });
  expect(400);
});

test("Should not update user if unauthenticated ", async () => {
  await request(app)
    .patch("/users/me")
    .send({
      name: "Ali",
    })
    .expect(401);
});

test("Should not update user with invalid name", async () => {
  await request(app)
    .patch("/users/me")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send({
      name: "",
    })
    .expect(400);
});

test("Should not update user with invalid email", async () => {
  await request(app)
    .patch("/users/me")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send({
      email: "@example.com",
    })
    .expect(400);
});

test("Should not update user with invalid password", async () => {
  await request(app)
    .patch("/users/me")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send({
      password: "worstpassword",
    })
    .expect(400);
});
