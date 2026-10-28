// The service-level pause gate: one run at a time, so one gate. Pausing aborts the in-flight model request and holds the run at its turn boundary; the harness, its UI and the in-memory role stack all stay alive. Resuming releases the wait and the engine re-issues the turn from the checkpoint it wrote at the turn's top.
export interface PauseGate {
	paused(): boolean
	// The signal handed to the in-flight LLM request; aborting it turns that call into a paused outcome instead of a retryable failure. A resumed gate hands out a fresh, un-aborted signal.
	signal(): AbortSignal
	requestPause(): void
	resume(): void
	// Resolves immediately when not paused; otherwise once resume() is called.
	waitWhilePaused(): Promise<void>
}

export function createPauseGate(): PauseGate {
	let paused = false
	let controller = new AbortController()
	let waiters: Array<() => void> = []
	return {
		paused() {
			return paused
		},
		signal() {
			return controller.signal
		},
		requestPause() {
			if (paused) return
			paused = true
			controller.abort()
		},
		resume() {
			if (!paused) return
			paused = false
			controller = new AbortController()
			for (const resolve of waiters.splice(0)) resolve()
		},
		waitWhilePaused() {
			if (!paused) return Promise.resolve()
			const { promise, resolve } = Promise.withResolvers<void>()
			waiters.push(resolve)
			return promise
		},
	}
}
