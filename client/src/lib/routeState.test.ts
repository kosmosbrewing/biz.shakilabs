import { describe, expect, it } from "vitest";
import {
  queryFirst,
  parseQueryInt,
  parseQueryFloat,
  parseQueryBoolean,
  buildQuery,
  normalizeQuery,
  toQueryString,
  isSameQuery,
} from "./routeState";

describe("routeState", () => {
  it("queryFirst는 배열/문자열만 추출한다", () => {
    expect(queryFirst("alpha")).toBe("alpha");
    expect(queryFirst(["first", "second"])).toBe("first");
    expect(queryFirst([123, "second"])).toBeNull();
    expect(queryFirst(undefined)).toBeNull();
  });

  it("숫자 파서는 유효하지 않은 값에 null을 반환한다", () => {
    expect(parseQueryInt("100")).toBe(100);
    expect(parseQueryInt(["42"])).toBe(42);
    expect(parseQueryInt("bad")).toBeNull();

    expect(parseQueryFloat("10.75")).toBe(10.75);
    expect(parseQueryFloat("bad")).toBeNull();
  });

  it("불리언 파서는 fallback을 존중한다", () => {
    expect(parseQueryBoolean("1")).toBe(true);
    expect(parseQueryBoolean("TRUE")).toBe(true);
    expect(parseQueryBoolean("0", true)).toBe(false);
    expect(parseQueryBoolean("unknown", true)).toBe(true);
    expect(parseQueryBoolean(undefined, false)).toBe(false);
  });

  it("buildQuery는 null/빈값을 제거하고 키를 정렬한다", () => {
    const result = buildQuery({
      z: "zeta",
      a: " alpha ",
      b: "",
      c: null,
      boolTrue: true,
      boolFalse: false,
    });

    expect(result).toEqual({
      a: "alpha",
      boolFalse: "0",
      boolTrue: "1",
      z: "zeta",
    });
  });

  it("normalizeQuery와 isSameQuery는 순서가 달라도 동등하게 본다", () => {
    const q1 = { b: "2", a: "1" };
    const q2 = { a: "1", b: ["2"] };

    expect(normalizeQuery(q1)).toEqual({ a: "1", b: "2" });
    expect(normalizeQuery(q2)).toEqual({ a: "1", b: "2" });
    expect(toQueryString(q1)).toBe("a=1&b=2");
    expect(isSameQuery(q1, q2)).toBe(true);
  });
});
