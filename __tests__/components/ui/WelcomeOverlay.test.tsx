import React from 'react'
import { render, screen, act } from '@testing-library/react'
import { WelcomeOverlay } from '@/components/ui/WelcomeOverlay'
import confetti from 'canvas-confetti'

// Mock canvas-confetti
jest.mock('canvas-confetti', () => ({
    __esModule: true,
    default: jest.fn(),
}))

describe('WelcomeOverlay', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        localStorage.clear()
        jest.useFakeTimers()
    })

    afterEach(() => {
        jest.useRealTimers()
    })

    it('renders correctly with userName', async () => {
        // Mock confetti to prevent actual execution issues in test env
        (confetti as unknown as jest.Mock).mockReturnValue(undefined);

        render(<WelcomeOverlay userName="Test User" alwaysShow={true} />)

        // Advance timers to let typewriter effect finish
        act(() => {
            jest.advanceTimersByTime(2000)
        })

        // Use findByText which supports async, or check for partial text
        const overlay = await screen.findByText((content) => content.includes('Welcome, Test User'));
        expect(overlay).toBeInTheDocument();
    })

    it('triggers confetti twice on mount', () => {
        render(<WelcomeOverlay userName="Guest" alwaysShow={true} />)

        expect(confetti).toHaveBeenCalledTimes(1) // Immediate call

        // Fast-forward time for the second call (300ms delay)
        act(() => {
            jest.advanceTimersByTime(300)
        })

        expect(confetti).toHaveBeenCalledTimes(2) // Second call
    })

    it('passes high z-index to confetti', () => {
        render(<WelcomeOverlay userName="Guest" alwaysShow={true} />)

        expect(confetti).toHaveBeenCalledWith(expect.objectContaining({
            zIndex: 10000
        }))
    })

    it('does NOT render if visited and alwaysShow is false', () => {
        localStorage.setItem('karma_visited', 'true')
        const { container } = render(<WelcomeOverlay userName="Return User" alwaysShow={false} />)

        expect(container).toBeEmptyDOMElement()
    })

    it('DOES render if visited but alwaysShow is true', async () => {
        localStorage.setItem('karma_visited', 'true')
        render(<WelcomeOverlay userName="Client User" alwaysShow={true} />)

        // Advance timers to let typewriter effect start
        act(() => {
            jest.advanceTimersByTime(100)
        })

        expect(await screen.findByText(/Welcome/)).toBeInTheDocument()
    })
})
