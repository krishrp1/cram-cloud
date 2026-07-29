import { describe, it, expect } from "vitest";
import { parseId } from "@/lib/parseId";

describe("parseId", () => {
  it("accepts a valid positive integer string", () => {
    expect(parseId("42")).toBe(42);
  });

  it("accepts a valid positive integer number", () => {
    expect(parseId(42)).toBe(42);
  });

  it("rejects null and undefined", () => {
    expect(parseId(null)).toBeNull();
    expect(parseId(undefined)).toBeNull();
  });

  it("rejects zero and negative numbers", () => {
    expect(parseId("0")).toBeNull();
    expect(parseId("-1")).toBeNull();
    expect(parseId(-5)).toBeNull();
  });

  it("rejects non-numeric strings", () => {
    expect(parseId("abc")).toBeNull();
    expect(parseId("")).toBeNull();
  });

  it("rejects strings with a valid numeric prefix but trailing garbage", () => {
    // parseInt would otherwise truncate these to 12 / 1 instead of
    // rejecting the malformed input outright.
    expect(parseId("12abc")).toBeNull();
    expect(parseId("1.5")).toBeNull();
  });

  it("rejects leading/trailing whitespace and a leading plus sign", () => {
    expect(parseId(" 12")).toBeNull();
    expect(parseId("12 ")).toBeNull();
    expect(parseId("+12")).toBeNull();
  });

  it("rejects values at and beyond the Postgres int4 boundary", () => {
    expect(parseId("2147483647")).toBe(2147483647); // max int4, still valid
    expect(parseId("2147483648")).toBeNull(); // one past max int4
    expect(parseId("99999999999999999999")).toBeNull(); // way overflowed
  });

  it("rejects unsafe integers", () => {
    expect(parseId(Number.MAX_SAFE_INTEGER + 1)).toBeNull();
  });
});
