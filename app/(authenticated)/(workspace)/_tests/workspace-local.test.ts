import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ChannelsSection } from "@app/(authenticated)/(workspace)/page";

describe("local workspace channel", () => {
  it("advertises only the private local WebChat", () => {
    const html = renderToStaticMarkup(createElement(ChannelsSection));

    expect(html).toContain("Private WebChat");
    expect(html).toContain("Tailscale");
    expect(html).toContain('href="/chat"');
    expect(html).not.toContain("iMessage");
    expect(html).not.toContain("sms:");
  });
});
