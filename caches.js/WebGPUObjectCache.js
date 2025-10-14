const countingMap = require('./countingMap.js');

class WebGPUObjectCaches {
    constructor({
        enable = ["pipelineLayouts",
            "bindGroupLayouts",
            "computeModules",
            "computePipelines",
        ],
    } = {}) {
        this.initiallyEnabled = enable;

        this.caches = [
            "pipelineLayouts",
            "bindGroupLayouts",
            "computeModules",
            "computePipelines"
        ]
        for (const cache of this.caches) {
            this[cache] = new countingMap({
                enabled: this.initiallyEnabled.includes(cache),
            });
        }
    }
    
    get stats() {
        return `Cache hit/misses:
Pipeline layouts: ${this.pipelineLayouts.hits}/${this.pipelineLayouts.misses}
Bind group layouts: ${this.bindGroupLayouts.hits}/${this.bindGroupLayouts.misses}
Compute modules: ${this.computeModules.hits}/${this.computeModules.misses}
Compute pipelines: ${this.computePipelines.hits}/${this.computePipelines.misses}`;
    }
    
    enable() {
        for (const enabled of this.initiallyEnabled) {
            this[enabled].enable();
        }
    }
    
    disable() {
        for (const enabled of this.initiallyEnabled) {
            this[enabled].disable();
        }
    }
}

// Test the WebGPUObjectCaches
const caches = new WebGPUObjectCaches();

// Simulate some cache operations
caches.pipelineLayouts.set("layout1", "pipeline_data");
caches.pipelineLayouts.get("layout1"); // hit
caches.pipelineLayouts.get("layout2"); // miss

caches.bindGroupLayouts.set("bind1", "bind_data");
caches.bindGroupLayouts.get("bind1"); // hit
caches.bindGroupLayouts.get("bind2"); // miss

console.log("WebGPU Object Caches created successfully!");
console.log("\n" + caches.stats);