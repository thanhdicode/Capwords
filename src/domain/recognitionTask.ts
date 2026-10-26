export type RecognitionToken = { signal: AbortSignal };

/** Owns one screen-scoped recognition request; navigation invalidates it. */
export class RecognitionTask {
  private current?: AbortController;

  start(): RecognitionToken {
    this.cancel();
    this.current = new AbortController();
    return { signal: this.current.signal };
  }

  isCurrent(token: RecognitionToken): boolean {
    return this.current?.signal === token.signal && !token.signal.aborted;
  }

  /** @returns whether there was a live request to cancel. */
  cancel(): boolean {
    const current = this.current;
    if (!current) return false;
    this.current = undefined;
    current.abort();
    return true;
  }

  complete(token: RecognitionToken): boolean {
    if (!this.isCurrent(token)) return false;
    this.current = undefined;
    return true;
  }
}
