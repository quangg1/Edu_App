export class EventSourceWrapper {
    private eventSource: EventSource | null = null;
    private messageHandlers: { [key: string]: ((data: any) => void)[] } = {};
    private errorHandler: ((error: Event) => void) | null = null;

    constructor(private url: string) {}

    addEventListener(event: string, handler: (data: any) => void) {
        if (!this.messageHandlers[event]) {
            this.messageHandlers[event] = [];
        }
        this.messageHandlers[event].push(handler);
    }

    onError(handler: (error: Event) => void) {
        this.errorHandler = handler;
    }

    connect() {
        this.eventSource = new EventSource(this.url);

        // Set up handlers for each event type
        Object.keys(this.messageHandlers).forEach(event => {
            this.eventSource?.addEventListener(event, (e: MessageEvent) => {
                try {
                    const data = JSON.parse(e.data);
                    this.messageHandlers[event].forEach(handler => handler(data));
                } catch (err) {
                    console.error(`Error processing ${event} event:`, err);
                }
            });
        });

        if (this.errorHandler) {
            this.eventSource.onerror = this.errorHandler;
        }
    }

    close() {
        this.eventSource?.close();
        this.eventSource = null;
    }
}