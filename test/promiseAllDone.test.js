"use strict";

const { promisify } = require("util");
const { promiseAllDone } = require("../src/promiseAllDone");

describe("promiseAllDone", () => {
  it("second reject is caught", async () => {
    let secondErrorStillRunning = true;
    try {
      // NOTE with Promise.all this will fail
      await promiseAllDone([
        Promise.resolve(1),
        Promise.resolve(2),
        Promise.resolve(3),
        Promise.reject(new Error("1")),
        (async () => {
          await promisify(setTimeout)(100);
          secondErrorStillRunning = false;
          throw new Error("2");
        })(),
      ]);
    } catch (err) {
      expect(secondErrorStillRunning).toBe(false);
    }
  });
});