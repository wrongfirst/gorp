import canvasConfetti from 'canvas-confetti';

function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min;
}

export function confetti() {
    canvasConfetti({
        angle: randomInRange(60, 120),
        spread: randomInRange(30, 70),
        particleCount: randomInRange(50, 100),
        origin: { y: 0.6 }
    });
}