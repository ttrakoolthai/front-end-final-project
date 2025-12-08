// src/components/__tests__/InfoModal.test.js
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InfoModal from "../InfoModal";

describe("InfoModal", () => {
    test("does not render when open is false", () => {
        render(<InfoModal open={false} onClose={jest.fn()} />);

        const heading = screen.queryByText(/about this dashboard/i);
        expect(heading).not.toBeInTheDocument();
    });

    test("renders title when open is true", () => {
        render(<InfoModal open={true} onClose={jest.fn()} />);

        // Title
        expect(screen.getByText(/about this dashboard/i)).toBeInTheDocument();

        // Dialog landmark
        expect(
            screen.getByRole("dialog", { name: /about this dashboard/i })
        ).toBeInTheDocument();
    });

    test("calls onClose when close button is clicked", async () => {
        const user = userEvent.setup();
        const onClose = jest.fn();

        render(<InfoModal open={true} onClose={onClose} />);

        const closeButton = screen.getByRole("button", { name: /close/i });
        await user.click(closeButton);

        expect(onClose).toHaveBeenCalledTimes(1);
    });
});
