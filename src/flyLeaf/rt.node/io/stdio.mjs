// 2023 © Lightingale Community, WingBlade Author(s)
// 2026-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0+ license.

"use strict";

import {
	StreamQueue
} from "../../../libs/rochelle@ltgcgo/splicer.mjs";

import { isolateSignals } from "../../common/method/io.mjs";

import NodeFs from "node:fs";
import NodeStream from "node:stream";

export class LeafStandardSink {
	#closed = false;
	/** @type {NodeJS.WriteStream & {fd: number}} */
	#rd;
	/** @type {WritableStream<Uint8Array>} */
	writable;
	/** @param {NodeJS.WriteStream & {fd: number}} resourceDescriptor */
	constructor(resourceDescriptor) {
		this.#rd = resourceDescriptor;
		if (NodeStream.Writable?.toWeb) {
			this.writable = NodeStream.Writable.toWeb(resourceDescriptor);
		};
	};
	close() {
		if (this.#closed) return;
		this.writable.close();
		try {
			NodeFs.closeSync(this.#rd.fd);
		} catch (err) {};
		this.#closed = true;
	};
	isTerminal() {
		return this.#rd.isTTY ?? false;
	};
	/** @param {Uint8Array} byob
	* @returns Promise<nummber|null> */
	write(byob) {
		if (this.#closed) return; // Deviation?
		const upThis = this;
		return new Promise((resolve, reject) => {
			NodeFs.write(upThis.#rd.fd, byob, (err, ioSize) => {
				if (err) reject(err);
				resolve(ioSize);
			});
		});
	};
	/** @param {Uint8Array} byob */
	writeSync(byob) {
		if (this.#closed) return; // Deviation?
		return NodeFs.writeSync(this.#rd.fd, byob);
	};
};

export class LeafStandardTeleTypeInput {
	#idle = true;
	/** @type {AbortController} */
	#ac; // EOF signal
	/** @type {AbortSignal} */
	#as; // EOF signal
	/** @type {NodeJS.ReadStream & {fd: number}} */
	#rd;
	/** @type {import("../../leaf.full/index.d.mts").LeafSetRawOptions|null} */
	#ro = null;
	/** @type {StreamQueue} */
	#sq;
	/** @param {NodeJS.ReadStream & {fd: number}} resourceDescriptor */
	constructor(resourceDescriptor) {
		const upThis = this;
		upThis.#rd = resourceDescriptor;
		upThis.#sq = new StreamQueue();
		upThis.#ac = new AbortController();
		upThis.#as = this.#ac.signal;
		resourceDescriptor.on("end", () => {
			upThis.close();
		});
	};
	close() {
		const upThis = this;
		if (upThis.#sq.closed) return;
		if (!upThis.#as.aborted) upThis.#ac.abort();
		upThis.#sq.close();
		try {
			NodeFs.closeSync(upThis.#rd.fd);
		} catch (err) {};
	};
	isTerminal() {
		return this.#rd.isTTY ?? false;
	};
	/** @returns {ReadableStream<Uint8Array>} */
	get readable() {
		// Prevent Node.js REPL from going haywire until actually accessed.
		const upThis = this;
		const sq = upThis.#sq;
		if (this.#idle) {
			(async () => {
				await sq.ready;
				for await (const chunk of upThis.#rd) {
					await sq.enqueue(chunk);
				};
				upThis.close();
			}) ();
			upThis.#idle = false;
		};
		return sq.readable;
	};
	/** @param {Uint8Array} byob
	* @returns Promise<nummber|null> */
	read(byob) {
		const upThis = this;
		if (
			upThis.#sq.closed ||
			upThis.#as.aborted ||
			upThis.#rd.readableEnded
		) return null; // Deviation?
		return new Promise((resolve, reject) => {
			upThis.#as.onabort = () => {
				resolve(null);
			};
			NodeFs.read(upThis.#rd.fd, byob, (err, ioSize) => {
				if (err) reject(err);
				resolve(ioSize);
			});
		});
	};
	/** @param {Uint8Array} byob */
	readSync(byob) {
		const upThis = this;
		if (
			upThis.#sq.closed ||
			upThis.#as.aborted ||
			upThis.#rd.readableEnded
		) return null; // Deviation?
		return NodeFs.readSync(upThis.#rd.fd, byob);
	};
	/** @param {import("../../leaf.full/index.d.mts").LeafSetRawOptions} options */
	setRaw(isRaw, options) {
		this.#rd.setRawMode(isRaw);
		if (isRaw) {
			this.#ro = options || {};
		} else {
			this.#ro = null;
		};
	};
};