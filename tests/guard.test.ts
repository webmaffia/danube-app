import { describe, expect, it } from "vitest";
import {
  checkProvenance,
  checkReturnLanguage,
  collectEvidence,
  emptyEvidence,
  extractFigures,
  mergeEvidence,
  needsProvenanceCheck,
  splitSentences,
  stripReturnLanguage,
} from "@/lib/agent/guard";
import { listUnits } from "@/lib/agent/tools";

describe("extractFigures", () => {
  it("parses AED amounts, millions, thousands, sizes and percentages", () => {
    const values = extractFigures("AED 20,000 token, AED 1.25M, 1.2 million, AED 525K, 1,180 sq ft, 20%, AED 1,450,000").map((f) => f.value);
    expect(values).toEqual([20000, 1250000, 1200000, 525000, 1180, 20, 1450000]);
  });

  it("reads a bare m as metres but AED 1.2M as millions", () => {
    expect(extractFigures("84 m from the lift").map((f) => f.value)).toEqual([84]);
    expect(extractFigures("AED 1.2M").map((f) => f.value)).toEqual([1200000]);
  });

  it("ignores unit numbers", () => {
    expect(extractFigures("Unit BY-0302 is lovely")).toEqual([]);
  });
});

describe("provenance", () => {
  const evidence = mergeEvidence(emptyEvidence(), collectEvidence({ price: 1_450_000, size_sqft: 1180, unit_no: "BY-0302", km: 10 }));

  it("passes figures that came from tool results, allowing spoken rounding", () => {
    expect(checkProvenance("Unit BY-0302 is 1,180 sq ft at about AED 1.45 million, 10 km from the marina.", evidence)).toEqual([]);
    expect(checkProvenance("That's AED 1.45M.", evidence)).toEqual([]);
    expect(checkProvenance("The token is AED 20,000.", evidence)).toEqual([]);
  });

  it("flags invented figures and unit numbers", () => {
    const v = checkProvenance("Unit BY-0909 is AED 3.9 million and 3 km from the beach.", evidence);
    expect(v.map((x) => x.text)).toEqual(["AED 3.9 million", "3 km", "BY-0909"]);
  });

  it("ignores trivial counts", () => {
    expect(checkProvenance("I have 2 options for you.", evidence)).toEqual([]);
  });

  it("collects evidence from real tool output", () => {
    const result = listUnits({ project_id: "bayz102", min_size: null, max_size: null, max_price: null, sort: null });
    const ev = collectEvidence(result);
    const p = result.units[0];
    expect(checkProvenance(`${p.unit_no} is ${p.size_sqft.toLocaleString("en-US")} sq ft.`, ev)).toEqual([]);
  });
});

describe("return language", () => {
  it("flags promised returns", () => {
    expect(checkReturnLanguage("This gives assured returns of 15%.")).toHaveLength(1);
    expect(checkReturnLanguage("Rental income is guaranteed here.")).toHaveLength(1);
    expect(checkReturnLanguage("We promise 5x growth.")).toHaveLength(1);
  });

  it("allows the approved negative phrasing", () => {
    expect(checkReturnLanguage("No one can guarantee rental income or resale value.")).toEqual([]);
    expect(checkReturnLanguage("Returns are not guaranteed.")).toEqual([]);
  });

  it("allows 'fixed' in unrelated senses", () => {
    expect(checkReturnLanguage("Compared with a fixed deposit at 4%, property is less liquid.")).toEqual([]);
    expect(checkReturnLanguage("The plan has a fixed price of AED 1.2 million.")).toEqual([]);
  });

  it("ignores guarantees that aren't about returns", () => {
    expect(checkReturnLanguage("I can guarantee the paperwork is clean.")).toEqual([]);
  });

  it("strips only the offending sentence", () => {
    expect(stripReturnLanguage("It's a great unit. Returns are guaranteed at 20%. Shall we look?")).toBe("It's a great unit. Shall we look?");
  });
});

describe("sentences", () => {
  it("splits without breaking decimals", () => {
    expect(splitSentences("It is AED 1.25M. Shall I hold it?")).toEqual(["It is AED 1.25M.", "Shall I hold it?"]);
  });

  it("marks sentences with figures for pre-speech checks", () => {
    expect(needsProvenanceCheck("Shall I show you the map?")).toBe(false);
    expect(needsProvenanceCheck("Unit BY-0302 is closest.")).toBe(true);
  });
});
