import { describe, it, expect } from "vitest";

import { harvestDeterministic } from "../harvest.ts";

describe("harvest", () => {
  it("harvestDeterministic extracts email url phone handle", () => {
    const draft = harvestDeterministic(
      "Contact alice@mailhost.test or @alice_osint — see https://wiki.example.org/x and +1 (555) 123-4567"
    );
    expect(
      draft.identifiers.some(
        (i) => i.type === "email" && i.value.includes("alice@mailhost.test")
      )
    ).toBeTruthy();
    expect(
      draft.identifiers.some(
        (i) => i.type === "url" && i.value.includes("wiki.example.org")
      )
    ).toBeTruthy();
    expect(
      draft.identifiers.some(
        (i) => i.type === "handle" && i.value === "@alice_osint"
      )
    ).toBeTruthy();
    expect(draft.identifiers.some((i) => i.type === "phone")).toBeTruthy();
    // junk example.com email dropped
    const junk = harvestDeterministic("noreply@example.com hello");
    expect(!junk.identifiers.some((i) => i.type === "email")).toBeTruthy();
  });

  it("harvestDeterministic empty on noise", () => {
    const draft = harvestDeterministic("no identifiers here");
    expect(draft.identifiers.length).toBe(0);
  });

  it("obfuscated emails canonicalize", () => {
    const draft = harvestDeterministic(
      "Reach me at bob [at] protonmail [dot] com or carol at riseup dot net or dave|cock|li"
    );
    const emails = new Set(
      draft.identifiers
        .filter((i) => i.type === "email")
        .map((i) => i.value)
        .sort()
    );
    expect(emails.has("bob@protonmail.com")).toBeTruthy();
    expect(emails.has("carol@riseup.net")).toBeTruthy();
    expect(emails.has("dave@cock.li")).toBeTruthy();
    expect(
      draft.identifiers.some(
        (i) => i.type === "email" && i.notes === "obfuscated"
      )
    ).toBeTruthy();
  });

  it("matrix telegram bluesky session", () => {
    const draft = harvestDeterministic(
      [
        "Matrix: @alice:matrix.org",
        "TG: https://t.me/map_activist",
        "BSKY: investigator.bsky.social",
        "Session: 0501234567890abcdef01234567890abcdef01234567890abcdef01234567890ab",
      ].join("\n")
    );
    expect(
      draft.identifiers.some(
        (i) =>
          i.type === "handle" &&
          i.platform === "matrix" &&
          i.value === "@alice:matrix.org"
      )
    ).toBeTruthy();
    expect(
      draft.identifiers.some(
        (i) =>
          i.type === "handle" &&
          i.platform === "telegram" &&
          i.value === "@map_activist"
      )
    ).toBeTruthy();
    expect(
      draft.identifiers.some(
        (i) =>
          i.type === "handle" &&
          i.platform === "bluesky" &&
          i.value === "investigator.bsky.social"
      )
    ).toBeTruthy();
    expect(
      draft.identifiers.some(
        (i) => i.type === "handle" && i.platform === "session"
      )
    ).toBeTruthy();
  });

  it("fediverse before email", () => {
    const draft = harvestDeterministic(
      "Follow @alice@social.example.org on fedi"
    );
    expect(
      draft.identifiers.some(
        (i) =>
          i.type === "handle" &&
          i.platform === "mastodon" &&
          i.value === "@alice@social.example.org"
      )
    ).toBeTruthy();
    expect(!draft.identifiers.some((i) => i.type === "email")).toBeTruthy();
  });

  it("crypto btc eth with validators", () => {
    // Valid-looking legacy BTC (mixed case + digits) — not pure hex
    const btc = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa";
    const eth = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
    const draft = harvestDeterministic(`Donate ${btc} or ETH ${eth}`);
    expect(
      draft.identifiers.some(
        (i) =>
          i.type === "crypto" && i.platform === "bitcoin" && i.value === btc
      )
    ).toBeTruthy();
    expect(
      draft.identifiers.some(
        (i) =>
          i.type === "crypto" &&
          i.platform === "ethereum" &&
          i.value === eth.toLowerCase()
      )
    ).toBeTruthy();
    // Pure hex 32-char should not match as BTC
    const junk = harvestDeterministic("hash deadbeefdeadbeefdeadbeefdeadbeef");
    expect(!junk.identifiers.some((i) => i.type === "crypto")).toBeTruthy();
  });

  it("zero-width stripped for emails", () => {
    const draft = harvestDeterministic("a\u200Blice@mailhost.test");
    expect(
      draft.identifiers.some(
        (i) => i.type === "email" && i.value === "alice@mailhost.test"
      )
    ).toBeTruthy();
  });

  it("onion ipv4 pgp discord paste steam", () => {
    const draft = harvestDeterministic(
      [
        "onion abcdefghijklmnop.onion",
        "ip 8.8.8.8 and private 192.168.1.1",
        "pgp ABCD EFGH IJKL MNOP QRST UVWX YZ12 3456 7890 ABCD",
        "join discord.gg/abc123xyz",
        "paste pastebin.com/raw/DeadBeef1",
        "steam https://steamcommunity.com/id/osinter",
      ].join("\n")
    );
    expect(
      draft.identifiers.some(
        (i) =>
          i.type === "url" && i.notes === "onion" && i.value.includes(".onion")
      )
    ).toBeTruthy();
    expect(
      draft.identifiers.some((i) => i.type === "ip" && i.value === "8.8.8.8")
    ).toBeTruthy();
    expect(
      !draft.identifiers.some(
        (i) => i.type === "ip" && i.value === "192.168.1.1"
      )
    ).toBeTruthy();
    expect(
      draft.identifiers.some(
        (i) =>
          i.type === "url" && i.platform === "discord" && i.notes === "invite"
      )
    ).toBeTruthy();
    expect(
      draft.identifiers.some((i) => i.type === "url" && i.notes === "paste")
    ).toBeTruthy();
    expect(
      draft.identifiers.some(
        (i) =>
          i.type === "handle" && i.platform === "steam" && i.value === "osinter"
      )
    ).toBeTruthy();
  });

  it("parenthetical platform and crossplatform claim", () => {
    const draft = harvestDeterministic(
      "I am osint_alice on twitter. Also @devuser (GitHub). 1. **Runs community wiki** — possible"
    );
    expect(
      draft.identifiers.some(
        (i) =>
          i.type === "handle" &&
          i.value === "@osint_alice" &&
          i.platform === "twitter"
      )
    ).toBeTruthy();
    expect(
      draft.identifiers.some(
        (i) =>
          i.type === "handle" &&
          i.value === "@devuser" &&
          i.platform === "github"
      )
    ).toBeTruthy();
    expect(
      draft.claims.some((c) => c.text.toLowerCase().includes("community wiki"))
    ).toBeTruthy();
  });

  it("labeled historical messengers", () => {
    const draft = harvestDeterministic(
      "Skype: cool.user99 Wickr: secret_map Signal: +15551234567 Keybase: alice"
    );
    expect(
      draft.identifiers.some(
        (i) => i.platform === "skype" && i.value === "cool.user99"
      )
    ).toBeTruthy();
    expect(
      draft.identifiers.some(
        (i) => i.platform === "wickr" && i.value === "secret_map"
      )
    ).toBeTruthy();
    expect(
      draft.identifiers.some(
        (i) => i.type === "phone" && i.platform === "signal"
      )
    ).toBeTruthy();
    expect(
      draft.identifiers.some(
        (i) => i.platform === "keybase" && i.value === "alice"
      )
    ).toBeTruthy();
  });

  it("quote-stripped IPB tail is not harvested as the subject", () => {
    const draft = harvestDeterministic(
      "My own note. On 1/6/2026 at 4:11 PM, Condemned said: contact leak@other.test"
    );
    expect(
      !draft.identifiers.some((i) => i.value.includes("leak@other.test"))
    ).toBeTruthy();
    expect(
      draft.claims.some((c) =>
        c.text.toLowerCase().includes("quoted text attributed to condemned")
      )
    ).toBeTruthy();
    expect(
      draft.questions.some((q) => q.text.toLowerCase().includes("condemned"))
    ).toBeTruthy();
  });

  it("quoted spans are masked; text after the quote is still harvested", () => {
    const draft = harvestDeterministic(
      [
        "Reach me@subject.test here.",
        "",
        "On 1/6/2026 at 4:11 PM, Condemned said: leak@other.test",
        "quoted continuation still masked",
        "",
        "Afterwards visit https://subject.example/after",
      ].join("\n")
    );
    expect(
      draft.identifiers.some((i) => i.value.includes("me@subject.test"))
    ).toBeTruthy();
    expect(
      !draft.identifiers.some((i) => i.value.includes("leak@other.test"))
    ).toBeTruthy();
    expect(
      draft.identifiers.some(
        (i) => i.type === "url" && i.value.includes("subject.example/after")
      )
    ).toBeTruthy();
    expect(
      draft.claims.some((c) =>
        c.text.toLowerCase().includes("quoted text attributed to condemned")
      )
    ).toBeTruthy();
  });

  it("negated and conditional self-disclosures are skipped", () => {
    const draft = harvestDeterministic(
      "If I am noise_user on twitter that would be funny. I never said I am skip_user on github."
    );
    expect(
      !draft.identifiers.some(
        (i) => i.type === "handle" && i.value.includes("noise_user")
      )
    ).toBeTruthy();
    expect(
      !draft.identifiers.some(
        (i) => i.type === "handle" && i.value.includes("skip_user")
      )
    ).toBeTruthy();
  });

  it("anchored payment handle and filename forensics", () => {
    const draft = harvestDeterministic(
      "my paypal is atticus55 see https://cdn.example/FB_IMG_1693261664957.jpg"
    );
    expect(
      draft.identifiers.some(
        (i) =>
          i.type === "handle" &&
          i.platform === "paypal" &&
          i.value === "@atticus55"
      )
    ).toBeTruthy();
    expect(
      draft.claims.some((c) =>
        c.text.toLowerCase().includes("facebook app save")
      )
    ).toBeTruthy();
  });
});
