class countingMap {
    constructor({ enabled = true } = {}) {
        this.enabled = enabled;
        this.map = new Map();
        this.hits = 0;
        this.misses = 0;
    }

    get(key) {
        if (!this.enabled) return undefined;
        if (this.map.has(key)) {
            this.hits++;
            return this.map.get(key);
        } else {
            this.misses++;
            return undefined;
        }
    }

    set(key, value) {
        if (!this.enabled) return undefined;
        this.map.set(key, value);
    }

    enable() {
        this.enabled = true;
    }

    disable() {
        this.enabled = false;
    }
}

module.exports = countingMap;