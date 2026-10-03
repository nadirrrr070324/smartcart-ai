import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { Card } from "./Card";
import { EmptyState } from "./EmptyState";
import { Input } from "./Input";
import { Modal } from "./Modal";
import { ProgressBar } from "./ProgressBar";

describe("Badge", () => {
  it("renders its children", () => {
    render(<Badge>New</Badge>);

    expect(screen.getByText("New")).toBeInTheDocument();
  });

  it("applies the variant classes", () => {
    const { container } = render(<Badge variant="success">Done</Badge>);

    expect(container.firstChild).toHaveClass("bg-[var(--success-subtle)]");
  });

  it("defaults to the default variant", () => {
    const { container } = render(<Badge>Plain</Badge>);

    expect(container.firstChild).toHaveClass("bg-[var(--background)]");
  });
});

describe("Button", () => {
  it("renders children and fires clicks", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Optimize</Button>);

    await userEvent.click(screen.getByRole("button", { name: "Optimize" }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does not fire while disabled", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick} disabled>Nope</Button>);

    await userEvent.click(screen.getByRole("button", { name: "Nope" }));

    expect(onClick).not.toHaveBeenCalled();
  });

  it("does not fire while loading", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick} isLoading>Working</Button>);

    await userEvent.click(screen.getByRole("button"));

    expect(onClick).not.toHaveBeenCalled();
  });

  it("shows a loading label while loading", () => {
    render(<Button isLoading>Working</Button>);

    expect(screen.getByRole("button")).toBeDisabled();
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("maps sizes to height classes", () => {
    const { container } = render(<Button size="lg">Big</Button>);

    expect(container.querySelector("button")).toHaveClass("h-12");
  });

  it("supports the danger variant", () => {
    render(<Button variant="danger">Delete</Button>);

    expect(screen.getByRole("button", { name: "Delete" })).toHaveClass(
      "text-[var(--error)]"
    );
  });
});

describe("Card", () => {
  it("renders children inside a bordered surface", () => {
    const { container } = render(<Card>Body</Card>);

    expect(container.firstChild).toHaveClass("rounded-2xl");
    expect(container.firstChild).toHaveClass("border");
    expect(screen.getByText("Body")).toBeInTheDocument();
  });

  it("applies the requested padding", () => {
    const { container } = render(<Card padding="lg">Body</Card>);

    expect(container.firstChild).toHaveClass("p-6");
  });

  it("omits padding when set to none", () => {
    const { container } = render(<Card padding="none">Body</Card>);

    expect(container.firstChild).not.toHaveClass("p-5");
  });
});

describe("Input", () => {
  it("associates the label with the field", () => {
    render(<Input label="Target price" />);

    expect(screen.getByLabelText("Target price")).toBeInTheDocument();
  });

  it("accepts typed values", async () => {
    const onChange = vi.fn();
    render(<Input label="Target price" onChange={onChange} />);

    await userEvent.type(screen.getByLabelText("Target price"), "250");

    expect(onChange).toHaveBeenCalled();
  });

  it("shows an error message", () => {
    render(<Input label="Target price" error="Required" />);

    expect(screen.getByText("Required")).toBeInTheDocument();
  });

  it("renders a prefix", () => {
    render(<Input label="Price" prefix="₹" />);

    expect(screen.getByText("₹")).toBeInTheDocument();
  });
});

describe("Modal", () => {
  it("renders nothing while closed", () => {
    render(
      <Modal isOpen={false} onClose={() => {}} title="Hidden">
        Inside
      </Modal>
    );

    expect(screen.queryByText("Hidden")).not.toBeInTheDocument();
  });

  it("renders the title, description and body when open", () => {
    render(
      <Modal isOpen onClose={() => {}} title="New Alert" description="Pick a product">
        Inside
      </Modal>
    );

    expect(screen.getByText("New Alert")).toBeInTheDocument();
    expect(screen.getByText("Pick a product")).toBeInTheDocument();
    expect(screen.getByText("Inside")).toBeInTheDocument();
  });

  it("closes from the close button", async () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose} title="Closable">
        Inside
      </Modal>
    );

    await userEvent.click(screen.getByRole("button"));

    expect(onClose).toHaveBeenCalled();
  });

  it("locks body scroll while open", () => {
    render(
      <Modal isOpen onClose={() => {}} title="Scroll lock">
        Inside
      </Modal>
    );

    expect(document.body.style.overflow).toBe("hidden");
  });
});

describe("ProgressBar", () => {
  it("renders the label and values by default", () => {
    render(<ProgressBar value={40} max={100} />);

    expect(screen.getByText("40% used")).toBeInTheDocument();
    expect(screen.getByText("40 / 100")).toBeInTheDocument();
  });

  it("hides the label on request", () => {
    render(<ProgressBar value={40} showLabel={false} />);

    expect(screen.queryByText("40% used")).not.toBeInTheDocument();
  });

  it("caps the fill at 100%", () => {
    const { container } = render(<ProgressBar value={250} max={100} showLabel={false} />);

    const fill = container.querySelector(".progress-bar");
    expect(fill).toHaveStyle({ width: "100%" });
  });

  it("does not divide by zero when max is zero", () => {
    render(<ProgressBar value={10} max={0} showLabel={false} />);

    expect(screen.queryByText("NaN")).not.toBeInTheDocument();
  });

  it("flags an over-budget fill", () => {
    render(<ProgressBar value={120} max={100} />);

    expect(screen.getByText("Over budget")).toBeInTheDocument();
  });
});

describe("EmptyState", () => {
  it("renders the icon, title, description and action", () => {
    render(
      <EmptyState
        icon={<span data-testid="icon">!</span>}
        title="Nothing here"
        description="Add something to get started."
        action={<button>Do it</button>}
      />
    );

    expect(screen.getByTestId("icon")).toBeInTheDocument();
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
    expect(screen.getByText("Add something to get started.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Do it" })).toBeInTheDocument();
  });

  it("omits the action slot when not provided", () => {
    render(
      <EmptyState icon={<span />} title="Nothing" description="Empty" />
    );

    expect(screen.getByText("Nothing")).toBeInTheDocument();
  });
});