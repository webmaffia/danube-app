import { describe, expect, it } from "vitest";
import { forSpeech } from "@/lib/avatar/spoken";

describe("forSpeech", () => {
  it("reads money, sizes, ranges and unit numbers naturally", () => {
    expect(forSpeech("BY-0302 is 1,180 sq ft at AED 1.45M, 84 m from the lift.")).toBe(
      "unit B Y 03 02 is 1,180 square feet at 1.45 million dirhams, 84 metres from the lift.",
    );
    expect(forSpeech("The token is AED 20,000 and the hold is 3–5 years.")).toBe("The token is 20,000 dirhams and the hold is 3 to 5 years.");
    expect(forSpeech("Dubai Marina is 10 km away.")).toBe("Dubai Marina is 10 kilometres away.");
    expect(forSpeech("Starts from AED 525K.")).toBe("Starts from 525 thousand dirhams.");
  });

  it("never reads a link out", () => {
    expect(forSpeech("See https://example.com/map for the location.")).toBe("See  for the location.");
  });
});
