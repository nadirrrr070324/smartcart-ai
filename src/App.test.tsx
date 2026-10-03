import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App";

describe("App smoke test", () => {
  it("mounts without crashing and renders the shell", () => {
    render(<App />);

    expect(screen.getByRole("main")).toBeInTheDocument();
  });

  it("renders the navigation landmarks", () => {
    render(<App />);

    expect(screen.getAllByRole("complementary").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("navigation").length).toBeGreaterThan(0);
  });

  it("shows a default page heading", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { level: 1, name: /./ })
    ).toBeInTheDocument();
  });

  it("renders the brand logo image", () => {
    render(<App />);

    const logos = screen.getAllByRole("img", { name: /smartcart/i });
    expect(logos.length).toBeGreaterThan(0);
    for (const logo of logos) {
      expect(logo.getAttribute("src")).toBeTruthy();
    }
  });
});