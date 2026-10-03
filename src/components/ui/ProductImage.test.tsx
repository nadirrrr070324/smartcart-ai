import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProductImage } from "./ProductImage";

const base = { name: "Sony Headphones", emoji: "🎧" };

describe("ProductImage", () => {
  it("renders the emoji tile when no image URL is set", () => {
    render(<ProductImage product={base} />);

    expect(screen.getByRole("img", { name: "Sony Headphones" })).toHaveTextContent("🎧");
    expect(screen.queryByRole("img", { name: "Sony Headphones" })?.tagName).toBe("DIV");
  });

  it("renders a real <img> when an image URL is set", () => {
    render(<ProductImage product={{ ...base, image: "https://example.com/photo.jpg" }} />);

    const img = screen.getByRole("img", { name: "Sony Headphones" });
    expect(img.tagName).toBe("IMG");
    expect(img.getAttribute("src")).toBe("https://example.com/photo.jpg");
  });

  it("falls back to emoji when the image fails to load", () => {
    render(<ProductImage product={{ ...base, image: "https://example.com/broken.jpg" }} />);

    fireEvent.error(screen.getByRole("img", { name: "Sony Headphones" }));

    expect(screen.getByRole("img", { name: "Sony Headphones" })).toHaveTextContent("🎧");
  });
});
