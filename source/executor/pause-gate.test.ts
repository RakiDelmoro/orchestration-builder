import { describe, expect, test } from 'bun:test'
import { createPauseGate } from './pause-gate.ts'

describe('pause gate', () => {
	test('honors pause until resume, then releases the waiter', async () => {
		const gate = createPauseGate()
		expect(gate.paused()).toBe(false)
		gate.requestPause()
		expect(gate.paused()).toBe(true)
		expect(gate.signal().aborted).toBe(true)
		let released = false
		const waiting = gate.waitWhilePaused().then(() => {
			released = true
		})
		await Promise.resolve()
		expect(released).toBe(false)
		gate.resume()
		await waiting
		expect(gate.paused()).toBe(false)
		expect(gate.signal().aborted).toBe(false)
	})

	test('is idempotent and does not hang when already resumed', async () => {
		const gate = createPauseGate()
		await gate.waitWhilePaused()
		gate.resume()
		gate.requestPause()
		gate.requestPause()
		gate.resume()
		await gate.waitWhilePaused()
		expect(gate.paused()).toBe(false)
	})
})
